const baseUrl = 'https://api.openweathermap.org/data/2.5';
const commonParams = `&units=metric&lang=pt_br&appid=${apiKey}`;
try {
    let weatherUrl, forecastUrl;
    if (city) {
        weatherUrl = `${baseUrl}/weather?q=${city}${commonParams}`;
        forecastUrl = `${baseUrl}/forecast?q=${city}${commonParams}`;
    } else if (lat && lon) {
        weatherUrl = `${baseUrl}/weather?lat=${lat}&lon=${lon}${commonParams}`;
        forecastUrl = `${baseUrl}/forecast?lat=${lat}&lon=${lon}${commonParams}`;
    } else {
        return res.status(400).json({ message: "Cidade ou coordenadas são necessárias." });
    }
    const [weatherResponse, forecastResponse] = await Promise.all([ axios.get(weatherUrl), axios.get(forecastUrl) ]);
    res.json({ current: weatherResponse.data, forecast: forecastResponse.data });
} catch (error) {
    const errorMessage = error.response?.data?.message || 'Erro ao buscar previsão do tempo.';
    res.status(error.response?.status || 500).json({ message: errorMessage });
}