// Foxglove uses showOpenFilePicker, which is unimplemented on mobile devices
import { showOpenFilePicker } from 'https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js'
window.showOpenFilePicker = showOpenFilePicker;
