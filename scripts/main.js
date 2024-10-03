console.log("Hello World! This code runs immediately when the file is loaded.");

Hooks.on("init", () => {
  console.log("This code runs once the Foundry VTT software begins its initialization workflow.");
});

Hooks.on("ready", () => {
  console.log("This code runs once core initialization is ready and game data is available.");
});

console.log("ello ello");