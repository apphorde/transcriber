import { shallowRef, unref } from "@lithium/web";

export function useMicrophone() {
  const audio = shallowRef(null);
  const supported = shallowRef(!!navigator.mediaDevices?.getUserMedia);
  const recorder = shallowRef(null, { shallow: true });
  let chunks = [];

  async function capture() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Not supported");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.value = new MediaRecorder(stream, { audioBitsPerSecond: 128000 });
  }

  async function start() {
    chunks.length = 0;
    await capture();

    const mr = unref(recorder);

    if (mr) {
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        if (chunks.length) {
          const blob = new Blob(chunks, { type: mr?.mimeType });
          audio.value = blob;
        }
      };

      mr.start();
    }
  }

  function stop() {
    recorder.value?.stop();
  }

  return { supported, audio, start, stop, capture };
}
