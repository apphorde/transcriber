<template>
  <div class="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold">Audio Transcriber</h1>
        <p class="text-gray-400 mt-2">Record and transcribe your audio</p>
      </div>
      <div class="bg-gray-800 rounded-lg p-8 space-y-6 shadow-lg">
        <div class="flex items-center justify-between mx-8">
          <button
            :class="running ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600'"
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
          <div class="text-4xl font-bold">{{ padLeft(minutes) }}:{{ padLeft(seconds) }}</div>
        </div>
        <div>
          <textarea
            class="bg-gray-800 border-2 border-gray-700 rounded-lg w-full h-32 p-4 text-white focus:outline-none focus:border-gray-600 resize-none"
            placeholder="Transcribed text will appear here..."
            v-model="transcription"
          ></textarea>
          <audio :controls="!!playbackUrl" :src="playbackUrl" class="w-full"></audio>
        </div>
        <div class="flex items-center justify-center">
          <button class="py-2 px-4 rounded-lg border border-gray-600" @click="onReset()">reset</button>
          <a
            class="py-2 px-4 rounded-lg border border-gray-600"
            download
            filename="audio.mp3"
            :class="playbackUrl || 'hidden'"
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
.bg-primary {
  background-color: #428958;
}
</style>
