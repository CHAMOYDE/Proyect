import "../styles/MetricCard.css"

function MetricCard({ title, value, color = "primary" }) {
  return (
    <div className={`metric-card metric-${color}`}>
      <h3>{title}</h3>
      <p className="metric-value">{value}</p>
    </div>
  )
}

export default MetricCard
