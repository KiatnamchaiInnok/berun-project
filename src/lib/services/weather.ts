import { prisma } from "@/lib/db";
import { heatAdvisoryFromDewPoint } from "@/lib/engine/plan-engine";

export async function getWeatherObservation(
  lat: number,
  lon: number,
  date: Date,
): Promise<{
  tempC: number;
  humidityPct: number;
  dewPointC: number;
  advisory: ReturnType<typeof heatAdvisoryFromDewPoint>;
  id?: string;
}> {
  const observedDate = new Date(date.toISOString().slice(0, 10));
  const latDec = Number(lat.toFixed(5));
  const lonDec = Number(lon.toFixed(5));

  const cached = await prisma.weatherObservation.findFirst({
    where: {
      observedDate,
      lat: latDec,
      lon: lonDec,
      hour: null,
    },
  });

  if (cached) {
    return {
      tempC: Number(cached.tempC),
      humidityPct: cached.humidityPct,
      dewPointC: Number(cached.dewPointC),
      advisory: heatAdvisoryFromDewPoint(Number(cached.dewPointC)),
      id: cached.id,
    };
  }

  const dateStr = observedDate.toISOString().slice(0, 10);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,relative_humidity_2m_mean&timezone=Asia%2FBangkok&start_date=${dateStr}&end_date=${dateStr}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = (await res.json()) as {
      daily?: {
        temperature_2m_max?: number[];
        relative_humidity_2m_mean?: number[];
      };
    };
    const tempC = data.daily?.temperature_2m_max?.[0] ?? 30;
    const humidityPct = Math.round(data.daily?.relative_humidity_2m_mean?.[0] ?? 70);
    const dewPointC = estimateDewPoint(tempC, humidityPct);

    const created = await prisma.weatherObservation.create({
      data: {
        observedDate,
        lat: latDec,
        lon: lonDec,
        tempC,
        humidityPct,
        dewPointC,
        fetchedAt: new Date(),
      },
    });

    return {
      tempC,
      humidityPct,
      dewPointC,
      advisory: heatAdvisoryFromDewPoint(dewPointC),
      id: created.id,
    };
  } catch {
    const dewPointC = 22;
    return {
      tempC: 32,
      humidityPct: 75,
      dewPointC,
      advisory: heatAdvisoryFromDewPoint(dewPointC),
    };
  }
}

function estimateDewPoint(tempC: number, humidityPct: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidityPct / 100);
  return Number(((b * alpha) / (a - alpha)).toFixed(1));
}
