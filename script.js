console.log("Welcome to Spotify!");
let currentSong = new Audio();
let songs = [];
let currFolder;
let currentIndex = 0; // Keep track of the current song index

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    try {
        currFolder = folder;
        let a = await fetch('/' + folder + '/');
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                const songPath = decodeURIComponent(element.href);
                const songName = songPath.substring(songPath.lastIndexOf('/') + 1);
                songs.push(songName);
            }
        }
    } catch (error) {
        console.error("Failed to fetch songs:", error);
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "pause.svg"; // Update play button image
    }
    const decodedTrack = decodeURIComponent(track);
    document.querySelector(".songinfo").innerHTML = decodedTrack;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const [index, song] of songs.entries()) {
        const decodedSong = decodeURIComponent(song);
        songUL.innerHTML += `<li> 
                            <img class="invert" src="music.svg" alt="">
                            <div class="info">
                                <div> ${decodedSong.replaceAll("%20", " ")} </div>
                                <div>Hasan</div>
                            </div>
                            <div class="playnow">
                                <span class="playnow">Play Now</span>
                                <img class="invert" src="play.svg" alt="" height="30px">
                            </div> </li>`;
    }

    Array.from(songUL.getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            currentIndex = index; // Update currentIndex when a song is clicked
            playMusic(songs[index].trim());
        });
    });

    return songs;
}

async function displayAlbums() {
    try {
        let a = await fetch('http://127.0.0.1:5501/songs/');
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;

        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer")

        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) { // <-- Error: Missing closing bracket
            const e = array[index];
            if (e.href.includes("/songs/")) {
                let folder = e.href.split("/").slice(-1)[0];
                console.log(folder);
                // Get the metadata of the folder
                let a = await fetch(`http://127.0.0.1:5501/songs/${folder}/info.json`);
                let response = await a.json();
                console.log(response);

                cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <!-- <circle cx="12" cy="12" r="12" fill="#1fdf64" /> Set the fill color of the circle to green -->
                                <path d="M5 20V4L19 12L5 20Z" fill="black" />
                                <!-- Set the fill color of the path to black -->
                            </svg>

                        </div>
                        <img src="/songs/${folder}/cover.png" alt="">
                        <h3>${response.title}</h3>
                        <p>${response.description}</p>
                    </div>`;
            }
        } // <-- Correction: Added missing closing bracket for the for loop

        // load the playlists    
        Array.from(document.getElementsByClassName("card")).forEach(card => {
            card.addEventListener("click", async () => {
                await getSongs(`songs/${card.dataset.folder}`);
                if (songs.length > 0) {
                    currentIndex = 0; // Reset to first song in the new folder
                    playMusic(songs[0], true);
                }
            });
        });
    } catch (error) {
        console.error("Failed to fetch albums:", error);
    }
}

async function main() {
    await getSongs("songs/ncs");
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    await displayAlbums();

    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            playMusic(songs[currentIndex]);
        }
    });

    next.addEventListener("click", () => {
        if (currentIndex < songs.length - 1) {
            currentIndex++;
            playMusic(songs[currentIndex]);
        }
    });

    document.querySelector(".range input").addEventListener("input", (e) => {
        console.log("Setting volume to", e.target.value, "/100");
        currentSong.volume = e.target.value / 100;
    });
}

main();
