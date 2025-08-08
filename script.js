const apiKey = "a29f013d22d3b751d89069e8506e4579";
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const themeToggle = document.getElementById("theme-toggle");
const locationBtn = document.getElementById("location-btn");
const loadingOverlay = document.getElementById("loading-overlay");

// Check for saved theme preference or use system preference
const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia(
  "(prefers-color-scheme: dark)"
).matches;

if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
  document.body.classList.add("dark");
}

// Initialize app with default city
document.addEventListener("DOMContentLoaded", () => {
  getWeather("Hyderabad");
  updateCurrentDate();
});

async function getWeather(city) {
  showLoading();
  try {
    // Get current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    if (!currentResponse.ok) throw new Error("City not found");

    const currentData = await currentResponse.json();

    // Get forecast data
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );

    const forecastData = await forecastResponse.json();

    displayWeather(currentData, forecastData);
    updateLastUpdated();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

function displayWeather(currentData, forecastData) {
  // Display current weather
  document.getElementById(
    "city-name"
  ).textContent = `${currentData.name}, ${currentData.sys.country}`;
  document.getElementById("temp").textContent = `${Math.round(
    currentData.main.temp
  )}°C`;
  document.getElementById("feels-like").textContent = `Feels like ${Math.round(
    currentData.main.feels_like
  )}°C`;
  document.getElementById("weather-desc").textContent =
    currentData.weather[0].description;
  document.getElementById(
    "humidity"
  ).textContent = `${currentData.main.humidity}%`;
  document.getElementById(
    "wind-speed"
  ).textContent = `${currentData.wind.speed} m/s`;
  document.getElementById(
    "pressure"
  ).textContent = `${currentData.main.pressure} hPa`;

  // Simple UV index simulation (OpenWeatherMap requires separate API call for real UV)
  const uvIndex = Math.min(
    Math.floor(currentData.wind.speed / 2 + currentData.clouds.all / 20),
    10
  );
  document.getElementById("uv-index").textContent = uvIndex;

  const iconCode = currentData.weather[0].icon;
  document.getElementById(
    "weather-icon"
  ).innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@4x.png" alt="${currentData.weather[0].description}">`;

  // Display 5-day forecast
  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = "";

  const dailyForecast = forecastData.list.filter(
    (item, index) => index % 8 === 0
  );

  dailyForecast.forEach((day) => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString(undefined, { weekday: "short" });

    forecastEl.innerHTML += `
      <div class="forecast-card">
        <div class="forecast-day">${dayName}</div>
        <img src="https://openweathermap.org/img/wn/${
          day.weather[0].icon
        }.png" alt="${day.weather[0].description}">
        <div class="forecast-temp">
          <span class="forecast-temp-max">${Math.round(
            day.main.temp_max
          )}°</span>
          <span class="forecast-temp-min">${Math.round(
            day.main.temp_min
          )}°</span>
        </div>
      </div>
    `;
  });

  // Display hourly forecast
  const hourlyEl = document.getElementById("hourly-forecast");
  hourlyEl.innerHTML = "";

  // Show next 12 hours
  const next12Hours = forecastData.list.slice(0, 12);

  next12Hours.forEach((hour) => {
    const date = new Date(hour.dt * 1000);
    const time = date.toLocaleTimeString(undefined, { hour: "numeric" });

    hourlyEl.innerHTML += `
      <div class="hourly-card">
        <div class="hourly-time">${time}</div>
        <img src="https://openweathermap.org/img/wn/${
          hour.weather[0].icon
        }.png" alt="${hour.weather[0].description}">
        <div class="hourly-temp">${Math.round(hour.main.temp)}°</div>
      </div>
    `;
  });

  // Update background based on weather and time
  updateBackground(
    currentData.weather[0].main,
    currentData.dt,
    currentData.sys.sunrise,
    currentData.sys.sunset
  );
}

function updateBackground(weather, time, sunrise, sunset) {
  const body = document.body;
  const isNight = time < sunrise || time > sunset;

  // Remove any existing weather classes
  body.classList.remove("sunny", "cloudy", "rainy", "snowy", "stormy");

  // Add appropriate weather class
  if (weather.toLowerCase().includes("clear") && !isNight) {
    body.classList.add("sunny");
  } else if (weather.toLowerCase().includes("cloud")) {
    body.classList.add("cloudy");
  } else if (weather.toLowerCase().includes("rain")) {
    body.classList.add("rainy");
  } else if (weather.toLowerCase().includes("snow")) {
    body.classList.add("snowy");
  } else if (weather.toLowerCase().includes("thunder")) {
    body.classList.add("stormy");
  }

  // Set dark mode for night time
  body.classList.toggle("dark", isNight);
}

function updateCurrentDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  document.getElementById("current-date").textContent = now.toLocaleDateString(
    undefined,
    options
  );
}

function updateLastUpdated() {
  const now = new Date();
  document.getElementById(
    "last-updated"
  ).textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

function showLoading() {
  loadingOverlay.classList.add("active");
}

function hideLoading() {
  loadingOverlay.classList.remove("active");
}

function showError(message) {
  alert(message); // In a production app, you'd want a prettier error display
}

// Event Listeners
searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) getWeather(city);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();
    if (city) getWeather(city);
  }
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    showLoading();
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
          );
          const data = await response.json();
          getWeather(data.name);
        } catch (error) {
          showError("Failed to get location data");
        } finally {
          hideLoading();
        }
      },
      (error) => {
        hideLoading();
        showError(
          "Geolocation access denied. Please enable it to use this feature."
        );
      }
    );
  } else {
    showError("Geolocation is not supported by your browser");
  }
});
