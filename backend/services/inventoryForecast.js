const mlr = require('ml-regression').SLR;

// salesData = [{date: '2024-06-01', sold: 10}, ...]
function forecastInventory(salesData, daysAhead = 7) {
  if (!salesData || salesData.length < 2) return [];
  const X = salesData.map((d, i) => i); // day index
  const y = salesData.map(d => d.sold);
  const regression = new mlr(X, y);
  const predictions = [];
  for (let i = X.length; i < X.length + daysAhead; i++) {
    predictions.push({
      day: i,
      predicted: Math.max(0, regression.predict(i))
    });
  }
  return predictions;
}

module.exports = { forecastInventory }; 