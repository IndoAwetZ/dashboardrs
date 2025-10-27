import React, { useEffect, useState, useRef } from 'react';

// Dashboard versi TV - Fullscreen slideshow 2 poli per halaman
export default function DashboardAntrianPoliTV() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pageIndex, setPageIndex] = useState(0);

  const PAGE_INTERVAL_MS = 8000; // 8 detik per halaman
  const REFRESH_MS = 10000; // 10 detik ambil data

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://project.rsaisyiyahsitifatimah.com/api/reg-periksa');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const filtered = json.data.filter(
          (item) => item.nm_dokter.toLowerCase() !== 'admin' && item.nm_poli.toLowerCase() !== 'igd'
        );
        const sorted = [...filtered].sort((a, b) => a.no_reg.localeCompare(b.no_reg));
        if (!mounted.current) return;
        setData(sorted);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const refresh = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clock
  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // Group data => { poli: { dokter: [items] } }
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.nm_poli]) acc[item.nm_poli] = {};
    if (!acc[item.nm_poli][item.nm_dokter]) acc[item.nm_poli][item.nm_dokter] = [];
    acc[item.nm_poli][item.nm_dokter].push(item);
    return acc;
  }, {});

  // Convert grouped object to array of poli entries
  const poliList = Object.keys(grouped).map((poli) => ({ name: poli, doctors: grouped[poli] }));

  // Build pages with 2 poli per page
  const pages = [];
  for (let i = 0; i < poliList.length; i += 2) {
    pages.push(poliList.slice(i, i + 2));
  }

  // Advance page every PAGE_INTERVAL_MS
  useEffect(() => {
    if (pages.length <= 1) return; // tidak perlu slide bila 0/1 halaman
    const t = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % pages.length);
    }, PAGE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [pages.length]);

  // Reset to first page when data changes significantly (optional)
  useEffect(() => {
    setPageIndex(0);
  }, [data.length]);

  // Sensor nama pasien
  const sensorNama = (nama) => {
    if (!nama) return '';
    const parts = nama.split(' ');
    return parts
      .map((part) => (part.length > 2 ? part[0] + '*'.repeat(part.length - 2) + part.slice(-1) : part))
      .join(' ');
  };

  // Formatting tanggal (Hari, DD Bulan YYYY)
  const formatTanggal = (date) => {
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const bulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ];
    return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Minimal styles: Tailwind classes assumed. Also include small CSS for transitions.
  return (
    <div className="w-screen h-screen bg-gray-50 font-[Lato] overflow-hidden">
      {/* Load Lato */}
      <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet" />

      {/* Floating glass header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1600px] bg-blue-700/80 backdrop-blur-md rounded-2xl shadow-lg text-white px-8 py-4 z-30 flex items-center justify-between">
        <div className="text-3xl font-bold">Dashboard Antrian Poli Spesialis</div>

        <div className="text-center">
          <div className="text-xl font-semibold">{currentTime.toLocaleTimeString('id-ID')}</div>
          <div className="text-lg mt-1">{formatTanggal(currentTime)}</div>
        </div>

        <div className="w-44 text-right text-sm opacity-90">{/* spare right side if needed */}</div>
      </header>

      {/* Main slideshow area (no scrollbar) */}
      <main className="absolute inset-0 top-28 bottom-28 flex items-center justify-center pointer-events-none">
        <div className="w-[95%] max-w-[1600px] h-full flex items-center justify-center">
          <div className="w-full h-full relative">
            {/* Pages container */}
            {pages.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl text-gray-600">Tidak ada data antrian</div>
              </div>
            )}

            {pages.map((page, idx) => (
              <section
                key={idx}
                aria-hidden={idx !== pageIndex}
                className={`absolute inset-0 transition-opacity duration-800 ease-in-out flex gap-8 p-6 ${idx === pageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                style={{ pointerEvents: idx === pageIndex ? 'auto' : 'none' }}
              >
                {/* Show up to 2 poli side by side */}
                {page.map((poliEntry, col) => (
                  <div
                    key={poliEntry.name}
                    className="flex-1 bg-white rounded-2xl shadow-lg p-6 flex flex-col pointer-events-auto"
                    style={{ minHeight: '60vh' }}
                  >
                    <h2 className="text-4xl font-bold text-blue-700 mb-4 border-b pb-3">{poliEntry.name}</h2>

                    <div className="flex-1 overflow-hidden">
                      {Object.keys(poliEntry.doctors).map((dokter) => (
                        <div key={dokter} className="mb-6">
                          <div className="text-2xl font-semibold text-gray-800 mb-2">{dokter}</div>
                          <ul className="space-y-2">
                            {poliEntry.doctors[dokter].map((pas, i) => (
                              <li key={i} className="text-xl bg-gray-100 rounded-md px-4 py-2">
                                {sensorNama(pas.nm_pasien)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* If only one poli on page, show empty pane to keep layout balanced */}
                {page.length === 1 && <div className="flex-1" />}
              </section>
            ))}
          </div>
        </div>
      </main>

      {/* Floating glass footer */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1600px] bg-blue-700/80 backdrop-blur-md rounded-2xl shadow-lg text-white px-6 py-3 z-30 flex items-center justify-between">
        <div className="text-lg font-medium">RS Aisyiyah Siti Fatimah – Sistem Antrian</div>
        <div className="text-right text-sm">
          {lastUpdate ? (
            <>
              Terakhir diperbarui: <span className="font-semibold">{lastUpdate.toLocaleTimeString('id-ID')}</span>
            </>
          ) : (
            'Belum ada pembaruan'
          )}
        </div>
      </footer>

      {/* Small accessibility note: page indicator (invisible on TV, but useful in dev) */}
      <div className="sr-only">Halaman {pageIndex + 1} dari {pages.length}</div>

      {/* Extra styles for transition timing (Tailwind doesn't support 800ms by default in inline) */}
      <style jsx>{`
        .duration-800 { transition-duration: 800ms; }
      `}</style>
    </div>
  );
}
