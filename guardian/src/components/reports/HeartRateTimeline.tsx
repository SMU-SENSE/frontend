'use client'

type HeartSample = { value: number | null; recordedAt: string }

export function HeartRateTimeline({ samples }: { samples: HeartSample[] }) {
  const valid = samples
    .filter((sample): sample is HeartSample & { value: number } =>
      typeof sample.value === 'number' &&
      Number.isFinite(sample.value) &&
      sample.value > 0 &&
      Number.isFinite(new Date(sample.recordedAt).getTime()))
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())

  if (!valid.length) {
    return <div className="gp-live-location" style={{ height: '100%', justifyContent: 'center' }}>
      <strong>심박 데이터 없음</strong>
      <span>센서 이벤트가 수신되면 이 영역에 표시됩니다.</span>
    </div>
  }

  const width = 740
  const height = 250
  const left = 54
  const right = 22
  const top = 18
  const bottom = 43
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const start = new Date(valid[0].recordedAt).getTime()
  const end = Math.max(start + 60_000, new Date(valid[valid.length - 1].recordedAt).getTime())
  const minBpm = Math.min(40, Math.floor((Math.min(...valid.map((sample) => sample.value)) - 10) / 10) * 10)
  const maxBpm = Math.max(150, Math.ceil((Math.max(...valid.map((sample) => sample.value)) + 10) / 10) * 10)
  const x = (time: number) => left + (time - start) / (end - start) * plotWidth
  const y = (value: number) => top + (maxBpm - value) / (maxBpm - minBpm) * plotHeight
  const points = valid.map((sample) => ({
    x: x(new Date(sample.recordedAt).getTime()),
    y: y(sample.value),
    bpm: sample.value,
    date: sample.recordedAt,
  }))
  const line = points.map((point, index) => (index ? 'L ' : 'M ') + point.x.toFixed(2) + ' ' + point.y.toFixed(2)).join(' ')
  const tickValues = [60, 80, 100, 110, 130, 150].filter((value) => value >= minBpm && value <= maxBpm)
  const multiDay = end - start > 24 * 60 * 60 * 1000
  const formatTime = (time: number) => new Date(time).toLocaleString('ko-KR', multiDay
    ? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit' })

  return (
    <svg viewBox={'0 0 ' + width + ' ' + height} preserveAspectRatio="xMidYMid meet" role="img" aria-label="실제 수신된 시간대별 심박수 추이, 안정 구간 60에서 100 BPM, 110 BPM 이상 고심박 강조" style={{ display: 'block', width: '100%', height: '100%' }}>
      <rect x={left} y={y(100)} width={plotWidth} height={y(60) - y(100)} fill="#e5f7ee" />
      {tickValues.map((value) => (
        <g key={value}>
          <line x1={left} y1={y(value)} x2={width - right} y2={y(value)} stroke={value === 110 ? '#e9a6a6' : '#e4e7e8'} strokeDasharray={value === 110 ? '5 4' : undefined} strokeWidth="1" />
          <text x={left - 9} y={y(value) + 4} fill="#65756d" fontSize="12" textAnchor="end">{value}</text>
        </g>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
        <g key={fraction}>
          <line x1={left + fraction * plotWidth} x2={left + fraction * plotWidth} y1={top} y2={height - bottom} stroke="#eef1f1" />
          <text x={left + fraction * plotWidth} y={height - 19} textAnchor="middle" fontSize={multiDay ? '10' : '12'} fill="#64746e">{formatTime(start + fraction * (end - start))}</text>
        </g>
      ))}
      <text x="13" y="14" fill="#64746e" fontSize="11">BPM</text>
      <path d={line} fill="none" stroke="#208967" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={point.bpm >= 110 ? 6 : 3.5} fill={point.bpm >= 110 ? '#dc444c' : '#208967'} stroke="#fff" strokeWidth="1.5">
          <title>{new Date(point.date).toLocaleString('ko-KR') + ' · ' + Math.round(point.bpm) + ' BPM' + (point.bpm >= 110 ? ' (고심박)' : '')}</title>
        </circle>
      ))}
      <text x={width - right} y="14" textAnchor="end" fontSize="11" fill="#64746e">녹색 배경: 60~100 BPM · 빨간 점: 110 BPM 이상</text>
    </svg>
  )
}
