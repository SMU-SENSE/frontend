'use client'

import { Camera } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout'
import { Button } from '../../../components/ui/Button'
import { loadOnboardingDraft, saveOnboardingDraft } from '../../../lib/onboardingDraft'

const relations = ['부모', '조부모', '교사', '기타']

export default function UserProfileOnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [relation, setRelation] = useState('부모')
  const [customRelation, setCustomRelation] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const draft = loadOnboardingDraft()
    setName(draft.userName ?? '')
    setBirthDate(draft.birthDate ?? '')
    if (draft.relation && !relations.includes(draft.relation)) {
      setRelation('기타')
      setCustomRelation(draft.relation)
    } else {
      setRelation(draft.relation ?? '부모')
    }
    setPhone(draft.emergencyPhone ?? '')
    setNotes(draft.notes ?? '')
  }, [])

  const valid = Boolean(name.trim() && birthDate && (relation !== '기타' || customRelation.trim()))

  return (
    <OnboardingLayout step={1} title="사용자 프로필" subtitle="AAC를 사용할 분의 정보를 입력해 주세요">
      <div className="profile-form">
        <div className="avatar-upload" aria-label="프로필 사진 추가">
          <Camera size={22} />
          <span>사진</span>
        </div>
        <label className="plain-field">
          <span>이름 <em>필수</em></span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="이름" />
        </label>
        <label className="plain-field">
          <span>생년월일 <em>필수</em></span>
          <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
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
            <input value={customRelation} onChange={(event) => setCustomRelation(event.target.value)} placeholder="관계를 입력해 주세요" />
          ) : null}
        </div>
        <label className="plain-field">
          <span>긴급 연락처</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="010-0000-0000" />
        </label>
        <label className="plain-field">
          <span>특이사항 (선택)</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="알아두면 좋은 내용을 적어 주세요" rows={3} />
        </label>
      </div>
      <Button
        fullWidth
        size="lg"
        disabled={!valid}
        onClick={() => {
          saveOnboardingDraft({
            userName: name.trim(),
            birthDate,
            relation: relation === '기타' ? customRelation.trim() : relation,
            emergencyPhone: phone,
            notes,
          })
          router.push('/onboarding/grid')
        }}
      >
        다음
      </Button>
    </OnboardingLayout>
  )
}
