import { OpenaiPath, REQUEST_TIMEOUT_MS } from './constant.js';

import {
  EventStreamContentType,
  fetchEventSource,
} from '@fortaine/fetch-event-source';

import fetch from 'node-fetch';

import { LogLevel, log } from './log.js';

export class ChatGPTApi {
  path(path) {
    return path;
  }

  extractMessage(res) {
    return res.choices?.at(0)?.message?.content ?? '';
  }

  async chat(options) {
    log(LogLevel.Simple, '[Request] openai payload: ', options.data.question);

    const shouldStream = true;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(OpenaiPath);
      const chatPayload = {
        method: 'POST',
        body: JSON.stringify(options.data),
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        },
      };

      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      if (shouldStream) {
        let responseText = '';
        let finished = false;

        const finish = () => {
          if (!finished) {
            options.onFinish(responseText);
            finished = true;
          }
        };

        controller.signal.onabort = finish;

        fetchEventSource(chatPath, {
          ...chatPayload,
          async onopen(res) {
            clearTimeout(requestTimeoutId);
            const contentType = res.headers.get('content-type');
            log(
              LogLevel.Detail,
              '[OpenAI] request response content type: ',
              contentType
            );

            if (contentType?.startsWith('text/plain')) {
              responseText = await res.clone().text();
              return finish();
            }

            if (
              !res.ok ||
              !res.headers
                .get('content-type')
                ?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
              const responseTexts = [responseText];
              let extraInfo = await res.clone().text();
              try {
                const resJson = await res.clone().json();
                extraInfo = resJson;
              } catch {}

              if (res.status === 401) {
                responseTexts.push('401 Unauthorized');
              }

              if (extraInfo) {
                responseTexts.push(extraInfo);
              }

              responseText = responseTexts.join('\n\n');

              return finish();
            }
          },
          onmessage(msg) {
            if (msg.data === '[DONE]' || finished) {
              return finish();
            }
            const text = msg.data;
            try {
              const json = JSON.parse(text);
              const delta = json.choices[0].delta.content;
              if (delta) {
                responseText += delta;
                options.onUpdate?.(responseText, delta);
              }
            } catch (e) {
              log(LogLevel.All, '[Request] parse error', text, msg);
            }
          },
          onclose() {
            finish();
          },
          onerror(e) {
            options.onError?.(e);
            throw e;
          },
          openWhenHidden: true,
        });
      } else {
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        options.onFinish(message);
      }
    } catch (e) {
      log(LogLevel.All, '[Request] failed to make a chat request', e);
      options.onError?.(e);
    }
  }
}

export { OpenaiPath };
