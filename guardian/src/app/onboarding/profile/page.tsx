'use client'

/* eslint-disable @next/next/no-img-element */
import { Camera, ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { aacUserApi } from '../../../api/aacUsers'
import { apiConfig } from '../../../api/client'
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'
import { loadOnboardingDraft, saveOnboardingDraft } from '../../../lib/onboardingDraft'
import type { RelationshipType } from '../../../types/models'

const relations = ['부모', '조부모', '교사', '기타'] as const
const relationshipTypeByLabel: Record<(typeof relations)[number], RelationshipType> = {
  부모: 'PARENT',
  조부모: 'GRANDPARENT',
  교사: 'TEACHER',
  기타: 'OTHER',
}

function getTodayInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string) {
  const today = new Date()
  if (!value) return { year: today.getFullYear() - 12, month: 1, day: 1 }
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function formatBirthDate(value: string) {
  return value ? value.replaceAll('-', '.') : '선택'
}

function surroundingValues(current: number, min: number, max: number) {
  return [-2, -1, 0, 1, 2].map((offset) => {
    let value = current + offset
    while (value < min) value = max - (min - value - 1)
    while (value > max) value = min + (value - max - 1)
    return value
  })
}

export default function UserProfileOnboardingPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [relation, setRelation] = useState<(typeof relations)[number]>('부모')
  const [customRelation, setCustomRelation] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [profileImageDataUrl, setProfileImageDataUrl] = useState('')
  const [birthOpen, setBirthOpen] = useState(false)
  const [birthDraft, setBirthDraft] = useState(() => parseDate(''))
  const [submitting, setSubmitting] = useState(false)
  const maxBirthDate = getTodayInputValue()
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const draft = loadOnboardingDraft()
    setName(draft.userName ?? '')
    setBirthDate(draft.birthDate ?? '')
    setProfileImageDataUrl(draft.profileImageDataUrl ?? '')
    if (draft.relation && relations.includes(draft.relation as (typeof relations)[number])) {
      setRelation(draft.relation as (typeof relations)[number])
    }
    setCustomRelation(draft.relationshipDetail ?? '')
    setPhone(draft.emergencyPhone ?? '')
    setNotes(draft.notes ?? '')
  }, [])

  useEffect(() => {
    const maxDay = daysInMonth(birthDraft.year, birthDraft.month)
    if (birthDraft.day > maxDay) {
      setBirthDraft((current) => ({ ...current, day: maxDay }))
    }
  }, [birthDraft.year, birthDraft.month, birthDraft.day])

  const trimmedName = name.trim()
  const trimmedPhone = phone.trim()
  const trimmedRelation = customRelation.trim()
  const valid = Boolean(
    trimmedName &&
      trimmedName.length <= 50 &&
      birthDate &&
      birthDate <= maxBirthDate &&
      trimmedPhone &&
      trimmedPhone.length <= 30 &&
      notes.length <= 1000 &&
      (relation !== '기타' || (trimmedRelation && trimmedRelation.length <= 100)),
  )

  const birthColumns = useMemo(() => {
    const maxDay = daysInMonth(birthDraft.year, birthDraft.month)
    return {
      years: surroundingValues(birthDraft.year, 1900, currentYear),
      months: surroundingValues(birthDraft.month, 1, 12),
      days: surroundingValues(Math.min(birthDraft.day, maxDay), 1, maxDay),
    }
  }, [birthDraft, currentYear])

  const saveLocalDraft = () => {
    const relationshipType = relationshipTypeByLabel[relation]
    const relationshipDetail = relation === '기타' ? trimmedRelation : null
    saveOnboardingDraft({
      userName: trimmedName,
      birthDate,
      relation,
      relationshipType,
      relationshipDetail: relationshipDetail ?? undefined,
      emergencyPhone: trimmedPhone,
      notes,
      profileImageDataUrl: profileImageDataUrl || undefined,
    })
    return { relationshipType, relationshipDetail }
  }

  const submit = async () => {
    if (!valid || submitting) return

    const { relationshipType, relationshipDetail } = saveLocalDraft()
    const localDraft = loadOnboardingDraft()

    if (apiConfig.useMockApi || localDraft.userId) {
      router.push('/users/setup/grid')
      return
    }

    setSubmitting(true)
    try {
      const user = await aacUserApi.create({
        name: trimmedName,
        birthDate,
        relationshipType,
        relationshipDetail,
        emergencyContact: trimmedPhone,
        notes: notes.trim() || null,
        profileImageUrl: null,
      })
      saveOnboardingDraft({ userId: user.id })
      router.push('/users/setup/grid')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '사용자 프로필을 저장하지 못했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openBirthPicker = () => {
    setBirthDraft(parseDate(birthDate))
    setBirthOpen(true)
  }

  const confirmBirth = () => {
    const yyyy = String(birthDraft.year)
    const mm = String(birthDraft.month).padStart(2, '0')
    const dd = String(birthDraft.day).padStart(2, '0')
    const next = `${yyyy}-${mm}-${dd}`
    if (next > maxBirthDate) return
    setBirthDate(next)
    setBirthOpen(false)
  }

  const chooseImage = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일을 선택해 주세요.', 'error')
      return
    }
    if (file.size > 1_500_000) {
      showToast('프로필 사진은 1.5MB 이하로 선택해 주세요.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setProfileImageDataUrl(result)
      saveOnboardingDraft({ profileImageDataUrl: result || undefined })
    }
    reader.readAsDataURL(file)
  }

  return (
    <OnboardingLayout step={1} title="사용자 프로필" subtitle="AAC에 표시될 사용자 정보를 입력하세요">
      <div className="profile-form">
        <div className="profile-primary-row">
          <div className="avatar-field">
            <span>사진 (선택)</span>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => chooseImage(event.target.files?.[0])}
            />
            <button
              type="button"
              className={`avatar-upload ${profileImageDataUrl ? 'avatar-upload--selected' : ''}`}
              aria-label="프로필 사진 추가"
              onClick={() => fileInputRef.current?.click()}
            >
              {profileImageDataUrl ? (
                <img src={profileImageDataUrl} alt="선택한 프로필" />
              ) : (
                <Camera size={28} strokeWidth={2} />
              )}
            </button>
          </div>

          <div className="profile-primary-fields">
            <label className="plain-field">
              <span>이름</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="홍길동"
                maxLength={50}
              />
            </label>
            <div className="plain-field">
              <span>생년월일</span>
              <button
                type="button"
                className={`profile-date-button ${birthDate ? 'profile-date-button--selected' : ''}`}
                onClick={openBirthPicker}
              >
                <span>{formatBirthDate(birthDate)}</span>
                <ChevronDown size={18} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="plain-field">
          <span>나와의 관계</span>
          <div className="relation-pills">
            {relations.map((item) => (
              <button
                key={item}
                type="button"
                className={relation === item ? 'relation-pill relation-pill--active' : 'relation-pill'}
                onClick={() => setRelation(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {relation === '기타' ? (
            <input
              autoFocus
              value={customRelation}
              onChange={(event) => setCustomRelation(event.target.value)}
              placeholder="관계를 입력해 주세요"
              maxLength={100}
            />
          ) : null}
        </div>

        <label className="plain-field">
          <span>긴급 연락처</span>
          <input
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="010-0000-0000"
            maxLength={30}
          />
        </label>

        <label className="plain-field">
          <span>특이사항 (선택)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="알레르기, 의사소통 팁 등"
            rows={3}
            maxLength={1000}
          />
        </label>
      </div>

      <Button fullWidth size="lg" disabled={!valid} loading={submitting} onClick={submit}>
        다음
      </Button>

      {birthOpen ? (
        <div
          className="birth-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setBirthOpen(false)
          }}
        >
          <section className="birth-modal" role="dialog" aria-modal="true" aria-labelledby="birth-modal-title">
            <div className="birth-modal__handle" aria-hidden />
            <h2 id="birth-modal-title">생년월일 선택</h2>
            <div className="birth-wheel-labels" aria-hidden>
              <span>년</span><span>월</span><span>일</span>
            </div>
            <div className="birth-wheels">
              <div className="birth-wheel">
                {birthColumns.years.map((year, index) => (
                  <button
                    key={`${year}-${index}`}
                    type="button"
                    className={index === 2 ? 'birth-wheel__value birth-wheel__value--selected' : 'birth-wheel__value'}
                    onClick={() => setBirthDraft((current) => ({ ...current, year }))}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <div className="birth-wheel">
                {birthColumns.months.map((month, index) => (
                  <button
                    key={`${month}-${index}`}
                    type="button"
                    className={index === 2 ? 'birth-wheel__value birth-wheel__value--selected' : 'birth-wheel__value'}
                    onClick={() => setBirthDraft((current) => ({ ...current, month }))}
                  >
                    {month}월
                  </button>
                ))}
              </div>
              <div className="birth-wheel">
                {birthColumns.days.map((day, index) => (
                  <button
                    key={`${day}-${index}`}
                    type="button"
                    className={index === 2 ? 'birth-wheel__value birth-wheel__value--selected' : 'birth-wheel__value'}
                    onClick={() => setBirthDraft((current) => ({ ...current, day }))}
                  >
                    {day}일
                  </button>
                ))}
              </div>
            </div>
            <div className="birth-modal__actions">
              <button type="button" className="birth-modal__cancel" onClick={() => setBirthOpen(false)}>취소</button>
              <button type="button" className="birth-modal__confirm" onClick={confirmBirth}>확인</button>
            </div>
          </section>
        </div>
      ) : null}
    </OnboardingLayout>
  )
}
