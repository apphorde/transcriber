import vtt from "https://vtt.jsfn.run/index.mjs";
import { computed, ref, watch } from "@li3/web";
import { useMicrophone } from "./useMicrophone.mjs";

export default function setup() {
  const { start, stop, audio, supported } = useMicrophone();

  let timer = 0;
  const playbackUrl = ref("");
  const transcriptions = ref([]);
  const running = ref(false);
  const playing = ref(false);
  const converting = ref(false);
  const elapsedTime = ref(0);
  const minutes = computed(() => Math.floor(elapsedTime.value / 60));
  const seconds = computed(() => Math.floor(elapsedTime.value % 60));
  const padLeft = (n) => String(n).padStart(2, "0");
  const player = ref(null);

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
      converting.value = true;
      transcriptions.value = [
        await vtt(audio.value),
        ...transcriptions.value
      ];
      converting.value = false;
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
    transcriptions.value = [];
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
    transcriptions,
    playing,
    converting,
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
