export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// basit yardımcı: true/on/1 => true
function toBool(v: any) {
  const s = (v ?? '').toString().toLowerCase();
  return s === 'true' || s === 'on' || s === '1';
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    console.log('[submit] raw:', raw);
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (e) {
      console.error('[submit] JSON parse fail:', e);
      return NextResponse.json({ ok:false, reason:'json', raw }, { status:400 });
    }

    const fullName = (data.fullName ?? '').toString().trim();
    const message  = (data.message ?? '').toString().trim();
    const subject  = (data.positionApplied ? `İş Başvurusu - ${data.positionApplied}` :
                      (data.subject ?? 'İş Başvurusu')).toString();
    const consent  = toBool(data.consent);

    if (!fullName || !message || !consent) {
      return NextResponse.json({
        ok:false, reason:'min-required',
        need:{ fullName:!fullName, message:!message, consent:!consent }
      }, { status:400 });
    }

    const created = await prisma.submission.create({
      data: {
        fullName,
        subject,
        message,
        consent,
        consentAt: consent ? new Date() : null,

        // kalan alanlar varsa yaz (yoksa hiç dokunma)
        phone: data.phone ?? null,
        birthDate: data.birthDate ?? null,
        gender: data.gender ?? null,
        address: data.address ?? null,
        positionApplied: data.positionApplied ?? null,
        employmentType: data.employmentType ?? null,
        shiftAvailability: data.shiftAvailability ?? null,
        educationLevel: data.educationLevel ?? null,
        foreignLanguages: data.foreignLanguages ?? null,
        prevCompany: data.prevCompany ?? null,
        prevTitle: data.prevTitle ?? null,
        prevDuration: data.prevDuration ?? null,
        prevReason: data.prevReason ?? null,
      }
    });

    return NextResponse.json({ ok:true, id: created.id });
  } catch (e:any) {
    console.error('[submit] server error:', e);
    return NextResponse.json({ ok:false, reason:'server', message: e?.message || String(e) }, { status:500 });
  }
}
