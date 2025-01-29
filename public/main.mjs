import vtt from "https://vtt.jsfn.run/index.mjs";
import { computed, ref, watch, tpl, mount, domReady } from "@li3/web";
import { useMicrophone } from "./useMicrophone.mjs";

const template = tpl`
  <div class="flex flex-col items-center justify-center h-screen bg-primary text-white">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold">Audio Transcriber</h1>
        <p class="opacity-80 mt-2">Record and transcribe your audio</p>
      </div>
      <div class="rounded-lg p-8 space-y-6 shaddow-lg">
        <div class="flex items-center justify-between space-x-4 bg-darker rounded-full py-4 px-4">
          <div class="text-4xl font-bold text-white pl-4">{{ padLeft(minutes) }}:{{ padLeft(seconds) }}</div>
          <button
            bind-class-name="'text-white font-bold py-4 px-4 rounded-full transition-colors duration-300 ' + (running ? 'bg-red-400 hover:bg-red-600 animate animate-pulse' : '')"
            on-click="onStart()"
            bind-disabled="!supported"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-8 w-8"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" x2="12" y1="19" y2="22"></line>
            </svg>
          </button>
        </div>
        <template if="transcription || playbackUrl">
          <div class="space-y-6">
            <audio ref="player" bind-src="playbackUrl" class="w-full"></audio>

            <div class="flex items-center justify-between space-x-4">
              <button on-click="onPlayPause()" class="text-white py-3 px-8 rounded-full bg-darker text-center">
                <template if="playing"
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24"
                    viewBox="0 -960 960 960"
                    width="24"
                    fill="currentColor"
                  >
                    <path d="M240-240v-480h480v480H240Z" />
                  </svg>
                </template>
                <template if="!playing">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24"
                    viewBox="0 -960 960 960"
                    width="24"
                    fill="currentColor"
                  >
                    <path d="M320-200v-560l440 280-440 280Z" />
                  </svg>
                </template>
              </button>
              <button class="text-white font-bold py-3 px-8 rounded-full bg-darker w-1/2 text-center" on-click="onReset()">
                reset
              </button>
              <a
                class="text-white font-bold py-3 px-8 rounded-full bg-darker w-1/2 text-center"
                download
                filename="audio.mp3"
                bind-href="playbackUrl"
                >download</a
              >
            </div>

            <div class="rounded-md w-full text-white">
              {{ transcription }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>`;

function setup() {
  const { start, stop, audio, supported } = useMicrophone();

  let timer = 0;
  const playbackUrl = ref("");
  const transcription = ref("");
  const running = ref(false);
  const playing = ref(false);
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

domReady().then(() => mount("#app", { template, setup }));
