import * as React from 'react'

type Props = {
  id: string
  fullName: string
  phone?: string | null
  gender?: string | null
  positionApplied?: string | null
  workType?: string | null
  shiftAvailability?: string | null
  educationLevel?: string | null
  foreignLanguages?: string | null
  prevCompany?: string | null
  prevTitle?: string | null
  prevDuration?: string | null
  prevReason?: string | null
  message?: string | null
  createdAt: string
}

export default function NewApplicationEmail(p: Props) {
  const row = (k: string, v?: React.ReactNode) => (
    <tr>
      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{k}</td>
      <td style={{ padding: '6px 8px' }}>{v || '-'}</td>
    </tr>
  )

  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui' }}>
      <h2>Yeni Başvuru 📝</h2>
      <div style={{ color: '#6b7280', marginBottom: 12 }}>
        {new Date(p.createdAt).toLocaleString('tr-TR')}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e5e7eb' }}>
        <tbody>
          {row('Ad Soyad', p.fullName)}
          {row('Telefon', p.phone)}
          {row('Cinsiyet', p.gender === 'female' ? 'Kadın' : p.gender === 'male' ? 'Erkek' : p.gender || '-')}
          {row('Pozisyon', p.positionApplied)}
          {row('Çalışma Türü', p.workType)}
          {row('Vardiya', p.shiftAvailability)}
          {row('Eğitim', p.educationLevel)}
          {row('Yabancı Dil', p.foreignLanguages)}
          {row('Önceki İşletme', p.prevCompany)}
          {row('Görev/Ünvan', p.prevTitle)}
          {row('Çalışma Süresi', p.prevDuration)}
          {row('Ayrılma Sebebi', p.prevReason)}
          {row('Ek Not', p.message)}
          {row('Kayıt ID', p.id)}
        </tbody>
      </table>
    </div>
  )
}
