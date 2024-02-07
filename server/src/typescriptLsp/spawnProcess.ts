import { spawn } from 'child_process';

const command = 'typescript-language-server';
const args = ['--stdio'];

// Spawn a new process
export const childProcess = spawn(command, args);

// Handle process events
childProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

childProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

childProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
