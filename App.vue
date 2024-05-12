<template>
  <div class="flex flex-col items-center justify-center h-screen bg-white text-gray-900">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold">Audio Transcriber</h1>
        <p class="text-gray-400 mt-2">Record and transcribe your audio</p>
      </div>
      <div class="bg-primary-dark rounded-lg p-8 space-y-6 shadow-lg">
        <div class="flex items-center justify-start space-x-4">
          <button
            :class="running ? 'bg-red-400 hover:bg-red-600 animate-pulse' : 'bg-primary'"
            class="text-white font-bold py-4 px-8 rounded-full transition-colors duration-300"
            @click="onStart()"
            :disabled="!supported"
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
          <div class="text-4xl font-bold text-white" v-if="running">{{ padLeft(minutes) }}:{{ padLeft(seconds) }}</div>
        </div>
        <div v-if="transcription || playbackUrl">
          <div class="border-primary border-2 border-gray-700 rounded-md w-full p-4 mb-6 text-white">
            {{ transcription }}
          </div>

          <audio :controls="!!playbackUrl" :src="playbackUrl" class="w-full"></audio>
        </div>

        <div class="flex items-center justify-center space-x-4" :class="playbackUrl || 'hidden'">
          <button class="text-white font-bold py-4 px-8 rounded-full bg-primary w-1/3" @click="onReset()">reset</button>
          <a
            class="text-white font-bold py-4 px-8 rounded-full bg-primary w-1/3"
            download
            filename="audio.mp3"
            :href="playbackUrl"
            >download</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useMicrophone } from './useMicrophone.js';
import vtt from 'https://vtt.jsfn.run/index.mjs';

const { capture, start, stop, audio, supported } = useMicrophone();

let timer = 0;
const playbackUrl = ref('');
const transcription = ref('');
const running = ref(false);
const elapsedTime = ref(0);
const minutes = computed(() => Math.floor(elapsedTime.value / 60));
const seconds = computed(() => Math.floor(elapsedTime.value % 60));

const padLeft = (n: number) => String(n).padStart(2, '0');

async function transcribe() {
  clearInterval(timer);
  running.value = false;
  stop();
}

async function onChange() {
  if (audio.value) {
    playbackUrl.value = URL.createObjectURL(audio.value!);
    transcription.value = await vtt(audio.value!);
  }
}

watch(audio, () => onChange());

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
  playbackUrl.value = '';
  transcription.value = '';
  running.value = false;
  elapsedTime.value = 0;
}

onMounted(() => {
  capture();
});
</script>

<style>
.border-primary {
  border-color: #53ac6f;
}
.bg-primary {
  background-color: #53ac6f;
}

.bg-primary-dark {
  background-color: #428958;
}
</style>
