import vtt from "https://vtt.jsfn.run/index.mjs";
import { effect, signal } from "@li3/reactive";
import { useMicrophone } from "./useMicrophone.mjs";

export default function setup() {
  const { start, stop, audio, supported } = useMicrophone();

  let timer = 0;
  const playbackUrl = signal("");
  const transcription = signal("");
  const running = signal(false);
  const playing = signal(false);
  const elapsedTime = signal(0);
  const minutes = effect(() => Math.floor(elapsedTime.value / 60));
  const seconds = effect(() => Math.floor(elapsedTime.value % 60));
  const padLeft = (n) => String(n).padStart(2, "0");

  const player = signal(null);

  async function transcribe() {
    clearInterval(timer);
    running.value = false;
    stop();
  }

  function onPlayPause() {
    if (player.value?.paused) {
      player.value.play();
      return;
    }

    player.value?.pause();
  }

  async function onChange() {
    if (audio.value) {
      playbackUrl.value = URL.createObjectURL(audio.value);
      transcription.value = await vtt(audio.value);
    }
  }

  watch(audio, onChange);

  async function onStart() {
    if (running.value) {
      transcribe();
      return;
    }

    timer = setInterval(onTick, 1000);
    elapsedTime.value = 0;
    running.value = true;
    start();
  }

  function onTick() {
    elapsedTime.value += 1;
  }

  function onReset() {
    playbackUrl.value = "";
    transcription.value = "";
    running.value = false;
    elapsedTime.value = 0;
  }

  watch(player, (value) => {
    if (value) {
      player.value.onplay = () => (playing.value = true);
      player.value.onpause = () => (playing.value = false);
    }
  });

  return {
    minutes,
    seconds,
    transcription,
    playing,
    supported,
    playbackUrl,
    running,
    player,
    padLeft,
    onStart,
    onPlayPause,
    onReset,
  };
}
