'use client'

import { useEffect, useRef, useState } from 'react'

type Coordinate = { latitude: number; longitude: number }
type NamedPlace = Coordinate & { id: string; name: string }
type MapClick = { latlng: { lat: number; lng: number } }
type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap
  panTo: (center: [number, number]) => LeafletMap
  on: (event: string, callback: (event: MapClick) => void) => LeafletMap
  invalidateSize: () => void
  remove: () => void
}
type LeafletLayer = {
  addTo: (map: LeafletMap) => LeafletLayer
  bindPopup: (label: string) => LeafletLayer
  remove: () => void
}
type LeafletApi = {
  map: (element: HTMLElement) => LeafletMap
  tileLayer: (url: string, options: { attribution: string; maxZoom: number }) => LeafletLayer
  circleMarker: (position: [number, number], options: Record<string, string | number | boolean>) => LeafletLayer
  polyline: (positions: [number, number][], options: Record<string, string | number>) => LeafletLayer
}

const LIBRARY_URL = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'
const STYLESHEET_URL = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'
let leafletPromise: Promise<LeafletApi> | null = null

function loadLeaflet(): Promise<LeafletApi> {
  const win = window as Window & { L?: LeafletApi }
  if (win.L) return Promise.resolve(win.L)
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise<LeafletApi>((resolve, reject) => {
    if (!document.querySelector('link[data-guardian-leaflet]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = STYLESHEET_URL
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = 'anonymous'
      link.setAttribute('data-guardian-leaflet', 'true')
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = LIBRARY_URL
    script.async = true
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    script.crossOrigin = 'anonymous'
    script.onload = () => win.L ? resolve(win.L) : reject(new Error('지도 라이브러리를 초기화할 수 없습니다.'))
    script.onerror = () => reject(new Error('지도 라이브러리를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    leafletPromise = null
    throw error
  })
  return leafletPromise
}

export function GuardianLiveMap({ current, selected, places, tracking, onPick }: {
  current: Coordinate | null
  selected: Coordinate | null
  places: NamedPlace[]
  tracking: boolean
  onPick: (latitude: number, longitude: number) => void
}) {
  const element = useRef<HTMLDivElement>(null)
  const api = useRef<LeafletApi | null>(null)
  const map = useRef<LeafletMap | null>(null)
  const placeLayers = useRef<LeafletLayer[]>([])
  const currentLayer = useRef<LeafletLayer | null>(null)
  const selectedLayer = useRef<LeafletLayer | null>(null)
  const routeLayer = useRef<LeafletLayer | null>(null)
  const history = useRef<[number, number][]>([])
  const centered = useRef(false)
  const pickCallback = useRef(onPick)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  pickCallback.current = onPick

  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((library) => {
      if (cancelled || !element.current) return
      api.current = library
      const instance = library.map(element.current).setView([36.35, 127.8], 6)
      library.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(instance)
      instance.on('click', (event) => pickCallback.current(event.latlng.lat, event.latlng.lng))
      map.current = instance
      setReady(true)
      window.requestAnimationFrame(() => instance.invalidateSize())
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : '지도를 불러오지 못했습니다.')
    })
    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
      api.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready || !map.current || !api.current) return
    placeLayers.current.forEach((layer) => layer.remove())
    placeLayers.current = places.filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
      .map((place) => api.current!.circleMarker([place.latitude, place.longitude], {
        radius: 8, color: '#167a54', fillColor: '#2ca77a', fillOpacity: 0.85, weight: 2,
      }).bindPopup(place.name).addTo(map.current!))
  }, [places, ready])

  useEffect(() => {
    if (!ready || !map.current || !api.current) return
    selectedLayer.current?.remove()
    selectedLayer.current = null
    if (selected && Number.isFinite(selected.latitude) && Number.isFinite(selected.longitude)) {
      selectedLayer.current = api.current.circleMarker([selected.latitude, selected.longitude], {
        radius: 10, color: '#b55e17', fillColor: '#ffb04d', fillOpacity: 1, weight: 3,
      }).bindPopup('새 장소로 선택한 위치').addTo(map.current)
      if (!centered.current) {
        map.current.setView([selected.latitude, selected.longitude], 15)
        centered.current = true
      }
    }
  }, [selected?.latitude, selected?.longitude, ready])

  useEffect(() => {
    if (!ready || !map.current || !api.current || !current) return
    if (!Number.isFinite(current.latitude) || !Number.isFinite(current.longitude)) return
    const point: [number, number] = [current.latitude, current.longitude]
    currentLayer.current?.remove()
    currentLayer.current = api.current.circleMarker(point, {
      radius: 9, color: '#ffffff', fillColor: '#236fda', fillOpacity: 1, weight: 3,
    }).bindPopup('사용자 기기에서 수신된 GPS').addTo(map.current)

    if (!centered.current) {
      map.current.setView(point, 15)
      centered.current = true
    }
    if (!tracking) return
    const last = history.current[history.current.length - 1]
    if (!last || last[0] !== point[0] || last[1] !== point[1]) {
      history.current = [...history.current, point].slice(-80)
      routeLayer.current?.remove()
      routeLayer.current = null
      if (history.current.length > 1) {
        routeLayer.current = api.current.polyline(history.current, {
          color: '#236fda', weight: 4, opacity: 0.8,
        }).addTo(map.current)
      }
    }
  }, [current?.latitude, current?.longitude, tracking, ready])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: 320 }}>
      <div ref={element} role="application" aria-label="사용자 위치 및 장소 선택 지도" style={{ width: '100%', height: '100%', minHeight: 320, borderRadius: 20, overflow: 'hidden', zIndex: 0 }} />
      {!ready ? <div role={error ? 'alert' : 'status'} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 20, background: '#edf3f2', color: error ? '#b33439' : '#526b62', zIndex: 1 }}>
        {error || '지도를 불러오는 중입니다…'}
      </div> : null}
      {ready ? <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 400, padding: '7px 11px', borderRadius: 10, color: '#244b40', background: 'rgba(255,255,255,.95)', fontSize: 12, textAlign: 'left', pointerEvents: 'none' }}>
        지도를 눌러 장소 핀을 지정하세요
      </div> : null}
      {ready ? <div style={{ position: 'absolute', bottom: 20, left: 12, zIndex: 400, padding: '5px 9px', borderRadius: 8, background: 'rgba(255,255,255,.92)', fontSize: 11, color: '#425851', pointerEvents: 'none' }}>
        <span style={{ color: '#236fda' }}>●</span> 사용자 GPS　<span style={{ color: '#ff9f32' }}>●</span> 선택한 핀　<span style={{ color: '#2ca77a' }}>●</span> 등록 장소
      </div> : null}
    </div>
  )
}
