const API_KEY = "11bdb4c95567738755353a2803f05175";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtnExtra");
const weatherContainer = document.getElementById("weatherContainer");
const loaderDiv = document.getElementById("loaderElement");
const errorDiv = document.getElementById("errorMessage");
const errorTextSpan = document.getElementById("errorText");

const weatherIconImg = document.getElementById("weatherIcon");
const temperatureSpan = document.getElementById("temperature");
const cityNameSpan = document.getElementById("cityName");
const localDateTimeSpan = document.getElementById("localDateTime");
const humiditySpan = document.getElementById("humidityValue");
const windSpan = document.getElementById("windValue");
const pressureSpan = document.getElementById("pressure");
const visibilitySpan = document.getElementById("visibility");
const feelsLikeSpan = document.getElementById("feelsLike");

function formatLocalTime(unixTimestamp, timezoneOffsetSec) {
    const utcDate = new Date(unixTimestamp * 1000);
    const localTimeMs = utcDate.getTime() + (timezoneOffsetSec * 1000);
    const localDate = new Date(localTimeMs);
    
    const options = { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    return localDate.toLocaleString(undefined, options);
}

function setWeatherIcon(conditionMain) {
    const iconMap = {
        "Clouds": "images/clouds.png",
        "Clear": "images/clear.png",
        "Drizzle": "images/drizzle.png",
        "Rain": "images/rain.png",
        "Mist": "images/mist.png",
        "Snow": "images/snow.png",
        "Thunderstorm": "images/thunderstorm.png",
        "Haze": "images/mist.png",
        "Smoke": "images/mist.png",
        "Fog": "images/mist.png"
    };
    
    let iconSrc = iconMap[conditionMain];
    
    if (!iconSrc) {
        const fallbackIcons = {
            "Thunderstorm": "https://cdn-icons-png.flaticon.com/512/1146/1146860.png",
            "Rain": "https://cdn-icons-png.flaticon.com/512/1995/1995577.png",
            "Clouds": "https://cdn-icons-png.flaticon.com/512/414/414927.png",
            "Clear": "https://cdn-icons-png.flaticon.com/512/869/869869.png",
            "Snow": "https://cdn-icons-png.flaticon.com/512/642/642102.png"
        };
        iconSrc = fallbackIcons[conditionMain] || "https://cdn-icons-png.flaticon.com/512/4814/4814264.png";
        weatherIconImg.src = iconSrc;
        return;
    }
    
    weatherIconImg.src = iconSrc;
    
    weatherIconImg.onerror = () => {
        weatherIconImg.src = "https://cdn-icons-png.flaticon.com/512/4814/4814264.png";
    };
}

function formatVisibility(meters) {
    if (!meters && meters !== 0) return "—";
    return (meters / 1000).toFixed(1);
}

function updateUI(data) {
    const tempC = Math.round(data.main.temp);
    const cityRealName = data.name;
    const humidity = data.main.humidity;
    const windSpeed = Math.round(data.wind.speed);
    const pressure = data.main.pressure;
    const visibilityKm = formatVisibility(data.visibility);
    const feelsLike = Math.round(data.main.feels_like);
    const weatherMain = data.weather[0].main;
    const timezoneOffset = data.timezone;
    
    temperatureSpan.textContent = `${tempC}°C`;
    cityNameSpan.textContent = cityRealName;
    humiditySpan.textContent = `${humidity}%`;
    windSpan.textContent = `${windSpeed} km/h`;
    pressureSpan.textContent = pressure;
    visibilitySpan.textContent = visibilityKm;
    feelsLikeSpan.textContent = feelsLike;
    
    const currentUnix = Math.floor(Date.now() / 1000);
    const formattedDateTime = formatLocalTime(currentUnix, timezoneOffset);
    localDateTimeSpan.innerHTML = `<i class="far fa-calendar-alt"></i> ${formattedDateTime}`;
    
    setWeatherIcon(weatherMain);
}

function showError(message, isTemporary = true) {
    errorTextSpan.textContent = message;
    errorDiv.classList.add("show");
    weatherContainer.classList.remove("show");
    loaderDiv.classList.remove("show");
    
    if (isTemporary) {
        setTimeout(() => {
            errorDiv.classList.remove("show");
        }, 4000);
    }
}

function hideError() {
    errorDiv.classList.remove("show");
}

function showLoader() {
    loaderDiv.classList.add("show");
    weatherContainer.classList.remove("show");
    hideError();
}

function hideLoader() {
    loaderDiv.classList.remove("show");
}

async function fetchWeather(city) {
    if (!city.trim()) {
        showError("Please enter a city name 🌆");
        return;
    }
    
    showLoader();
    
    try {
        const response = await fetch(BASE_URL + encodeURIComponent(city) + `&appid=${API_KEY}`);
        const data = await response.json();
        
        if (response.status !== 200 || data.cod !== 200) {
            let errMsg = "City not found!";
            if (data.message === "city not found") errMsg = "City not found! Try another name 🧭";
            else if (data.message) errMsg = data.message;
            throw new Error(errMsg);
        }
        
        updateUI(data);
        hideLoader();
        weatherContainer.classList.add("show");
        
    } catch (err) {
        console.error(err);
        hideLoader();
        showError(err.message || "Unable to fetch weather. Check your connection.");
        weatherContainer.classList.remove("show");
    }
}

function getUserLocationWeather() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser");
        return;
    }
    
    showLoader();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const geoUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
            
            try {
                const res = await fetch(geoUrl);
                const data = await res.json();
                
                if (data.cod === 200) {
                    cityInput.value = data.name;
                    updateUI(data);
                    hideLoader();
                    weatherContainer.classList.add("show");
                } else {
                    throw new Error("Could not fetch weather for your location");
                }
            } catch (err) {
                hideLoader();
                showError("Location access failed. Please enter city manually.");
                weatherContainer.classList.remove("show");
            }
        },
        (error) => {
            hideLoader();
            let errorMsg = "Location access denied. Please enter city name.";
            if (error.code === 1) errorMsg = "Please allow location access or enter city manually.";
            else if (error.code === 2) errorMsg = "Location unavailable. Enter city name.";
            showError(errorMsg);
            weatherContainer.classList.remove("show");
        }
    );
}

searchBtn.addEventListener("click", () => {
    fetchWeather(cityInput.value);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        fetchWeather(cityInput.value);
    }
});

if (geoBtn) {
    geoBtn.addEventListener("click", getUserLocationWeather);
}

window.addEventListener("DOMContentLoaded", () => {
    const defaultCity = "New York";
    cityInput.value = defaultCity;
    fetchWeather(defaultCity);
});