'use client'

import { Camera } from 'lucide-react'
import { useEffect, useState } from 'react'
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

export default function UserProfileOnboardingPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [relation, setRelation] = useState<(typeof relations)[number]>('부모')
  const [customRelation, setCustomRelation] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const maxBirthDate = getTodayInputValue()

  useEffect(() => {
    const draft = loadOnboardingDraft()
    setName(draft.userName ?? '')
    setBirthDate(draft.birthDate ?? '')
    if (draft.relation && relations.includes(draft.relation as (typeof relations)[number])) {
      setRelation(draft.relation as (typeof relations)[number])
    }
    setCustomRelation(draft.relationshipDetail ?? '')
    setPhone(draft.emergencyPhone ?? '')
    setNotes(draft.notes ?? '')
  }, [])

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

  const submit = async () => {
    if (!valid || submitting) return

    const relationshipType = relationshipTypeByLabel[relation]
    const relationshipDetail = relation === '기타' ? trimmedRelation : null
    const localDraft = loadOnboardingDraft()

    saveOnboardingDraft({
      userName: trimmedName,
      birthDate,
      relation,
      relationshipType,
      relationshipDetail: relationshipDetail ?? undefined,
      emergencyPhone: trimmedPhone,
      notes,
    })

    if (apiConfig.useMockApi || localDraft.userId) {
      router.push('/onboarding/grid')
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
      router.push('/onboarding/grid')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '사용자 프로필을 저장하지 못했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <OnboardingLayout step={1} title="사용자 프로필" subtitle="AAC를 사용할 분의 정보를 입력해 주세요">
      <div className="profile-form">
        <div className="avatar-upload" aria-label="프로필 사진 추가">
          <Camera size={22} />
          <span>사진</span>
        </div>
        <label className="plain-field">
          <span>이름 <em>필수</em></span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름"
            maxLength={50}
          />
        </label>
        <label className="plain-field">
          <span>생년월일 <em>필수</em></span>
          <input
            type="date"
            value={birthDate}
            max={maxBirthDate}
            onChange={(event) => setBirthDate(event.target.value)}
          />
        </label>
        <div className="plain-field">
          <span>나와의 관계 <em>필수</em></span>
          <div className="relation-pills">
            {relations.map((item) => (
              <button key={item} type="button" className={relation === item ? 'relation-pill relation-pill--active' : 'relation-pill'} onClick={() => setRelation(item)}>
                {item}
              </button>
            ))}
          </div>
          {relation === '기타' ? (
            <input
              value={customRelation}
              onChange={(event) => setCustomRelation(event.target.value)}
              placeholder="관계를 입력해 주세요"
              maxLength={100}
            />
          ) : null}
        </div>
        <label className="plain-field">
          <span>긴급 연락처 <em>필수</em></span>
          <input
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
            placeholder="알아두면 좋은 내용을 적어 주세요"
            rows={3}
            maxLength={1000}
          />
        </label>
      </div>
      <Button fullWidth size="lg" disabled={!valid} loading={submitting} onClick={submit}>
        다음
      </Button>
    </OnboardingLayout>
  )
}
