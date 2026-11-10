import { useEffect, useMemo, useState } from "react";

const today = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const addDays = (value, offset) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const initialDates = { check_in: today(1), check_out: today(2), guests: 2 };
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "មានបញ្ហាក្នុងការតភ្ជាប់។ សូមព្យាយាមម្ដងទៀត។");
  return data;
}

function App() {
  const [rooms, setRooms] = useState([]);
  const [dates, setDates] = useState(initialDates);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [booking, setBooking] = useState({ guest_name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);

  const nights = useMemo(() => {
    const start = new Date(`${dates.check_in}T00:00:00`);
    const end = new Date(`${dates.check_out}T00:00:00`);
    return Math.max(1, Math.round((end - start) / 86400000));
  }, [dates.check_in, dates.check_out]);

  async function loadRooms(searchDates = false) {
    setLoading(true);
    setError("");
    try {
      const query = searchDates
        ? `?check_in=${encodeURIComponent(dates.check_in)}&check_out=${encodeURIComponent(dates.check_out)}`
        : "";
      setRooms(await request(`/api/rooms${query}`));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  function chooseRoom(room) {
    setSelectedRoom(room);
    setNotice("");
    setError("");
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  }

  async function submitBooking(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const result = await request("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          ...booking,
          ...dates,
          room_id: selectedRoom.id,
          guests: Number(dates.guests),
        }),
      });
      setNotice(`បានទទួលការកក់របស់អ្នកហើយ! លេខកក់ #${result.id} — ក្រុមការងារយើងនឹងទាក់ទងទៅអ្នកឆាប់ៗនេះ។`);
      setSelectedRoom(null);
      setBooking({ guest_name: "", email: "", phone: "" });
      await loadRooms(true);
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Sokha Haven home">
          <span className="brand-mark">S</span>
          <span>SOKHA <b>HAVEN</b><small>STAY A LITTLE CLOSER</small></span>
        </a>
        <nav className="main-nav" aria-label="មឺនុយ">
          <a href="#stay">បន្ទប់ស្នាក់នៅ</a>
          <a href="#experience">បទពិសោធន៍</a>
          <a href="#about">អំពីយើង</a>
        </nav>
        <button className="admin-link" onClick={() => setAdminOpen(true)}>អ្នកគ្រប់គ្រង <span>↗</span></button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-image" />
          <div className="hero-content">
            <p className="eyebrow light">សម្រាកយ៉ាងមានន័យ · កម្ពុជា</p>
            <h1>កន្លែងសម្រាក<br />ដ៏ពិសេស <em>របស់អ្នក</em></h1>
            <p className="hero-copy">ស្វែងរកភាពស្ងប់ស្ងាត់ និងភាពកក់ក្ដៅ<br className="desktop-break" /> ក្នុងការស្នាក់នៅដែលយើងរៀបចំដោយចិត្ត។</p>
            <a className="text-link light-link" href="#stay">ស្វែងយល់ពីបន្ទប់ <span>↓</span></a>
          </div>
          <div className="hero-caption"><span>01</span> <i /> រស់នៅយឺតៗ បង្កើតអនុស្សាវរីយ៍</div>
          <div className="hero-side">SOKHA HAVEN · EST. 2018</div>
        </section>

        <section className="booking-bar" aria-label="ស្វែងរកបន្ទប់">
          <label>
            <span>ថ្ងៃចូលស្នាក់នៅ</span>
            <input type="date" min={today()} value={dates.check_in} onChange={(event) => {
              const next = event.target.value;
              setDates((previous) => ({
                ...previous,
                check_in: next,
                check_out: previous.check_out <= next ? addDays(next, 1) : previous.check_out,
              }));
            }} />
          </label>
          <label>
            <span>ថ្ងៃចេញ</span>
            <input type="date" min={dates.check_in} value={dates.check_out} onChange={(event) => setDates({ ...dates, check_out: event.target.value })} />
          </label>
          <label className="guest-field">
            <span>ចំនួនភ្ញៀវ</span>
            <select value={dates.guests} onChange={(event) => setDates({ ...dates, guests: event.target.value })}>
              {[1, 2, 3, 4].map((guest) => <option key={guest} value={guest}>{guest} នាក់</option>)}
            </select>
          </label>
          <button className="search-button" onClick={() => loadRooms(true)}>ស្វែងរកបន្ទប់ <span>→</span></button>
        </section>

        <section className="intro-section" id="about">
          <p className="eyebrow">សូមស្វាគមន៍មកកាន់ Sokha Haven</p>
          <h2>ផ្ទះមួយកន្លែង<br /><em>ឆ្ងាយពីផ្ទះ។</em></h2>
          <p>នៅទីនេះ ពេលវេលាហាក់ដូចជាយឺតបន្តិច។ ចាប់ផ្ដើមថ្ងៃថ្មីជាមួយកាហ្វេក្តៅៗ ស្រូបខ្យល់ស្រស់ និងអនុញ្ញាតឱ្យយើងមើលថែអ្នក។</p>
          <div className="intro-detail"><span>10°37' N</span><i /> <span>កម្ពុជា</span></div>
        </section>

        <section className="rooms-section" id="stay">
          <div className="section-heading">
            <div><p className="eyebrow">កន្លែងដែលអ្នកស្រឡាញ់</p><h2>បន្ទប់ស្នាក់នៅ <em>របស់យើង</em></h2></div>
            <p>រៀបចំសម្រាប់ការសម្រាក<br />និងពេលវេលាដ៏មានតម្លៃ។</p>
          </div>
          {error && !selectedRoom && <p className="notice error-notice">{error}</p>}
          {loading ? <div className="loading-state">កំពុងស្វែងរកបន្ទប់...</div> : (
            <div className="room-grid">
              {rooms.map((room, index) => (
                <article className="room-card" key={room.id}>
                  <div className="room-image-wrap">
                    <img src={room.image} alt={room.name} loading="lazy" />
                    <span className="room-number">0{index + 1}</span>
                  </div>
                  <div className="room-meta"><span>{room.category}</span><span>រហូតដល់ {room.capacity} នាក់</span></div>
                  <h3>{room.name}</h3>
                  <p className="room-description">{room.description}</p>
                  <div className="amenities">{room.amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div>
                  <div className="room-footer">
                    <p><b>{currency.format(room.price)}</b><span> / យប់</span></p>
                    <button className="outline-button" onClick={() => chooseRoom(room)}>កក់បន្ទប់ <span>↗</span></button>
                  </div>
                </article>
              ))}
              {!rooms.length && !loading && <div className="empty-state">មិនមានបន្ទប់ទំនេរសម្រាប់កាលបរិច្ឆេទនេះទេ។ សូមជ្រើសរើសថ្ងៃផ្សេង។</div>}
            </div>
          )}
        </section>

        <section className="quote-section" id="experience">
          <span className="quote-mark">“</span>
          <p>ទីកន្លែងដែលធ្វើឱ្យអ្នក<br />ចង់ត្រឡប់មកវិញ។</p>
          <span className="quote-note">YOUR QUIET PLACE TO RETURN TO</span>
        </section>

        <section className="booking-section" id="booking">
          <div className="booking-copy">
            <p className="eyebrow">ចាប់ផ្ដើមការសម្រាករបស់អ្នក</p>
            <h2>កក់កន្លែង<br /><em>របស់អ្នក។</em></h2>
            <p>ជំហានតូចមួយទៀតរហូតដល់ការសម្រាកដ៏ល្អឥតខ្ចោះ។</p>
          </div>
          <form className="booking-form" onSubmit={submitBooking}>
            {selectedRoom ? (
              <>
                <div className="selected-room"><span>បន្ទប់ដែលបានជ្រើសរើស</span><b>{selectedRoom.name}</b><small>{currency.format(selectedRoom.price * nights)} · {nights} យប់</small></div>
                <div className="form-grid">
                  <label>ឈ្មោះពេញ<input required minLength="2" maxLength="100" value={booking.guest_name} onChange={(event) => setBooking({ ...booking, guest_name: event.target.value })} placeholder="បញ្ចូលឈ្មោះរបស់អ្នក" /></label>
                  <label>អ៊ីមែល<input required type="email" value={booking.email} onChange={(event) => setBooking({ ...booking, email: event.target.value })} placeholder="you@example.com" /></label>
                  <label>លេខទូរស័ព្ទ<input required type="tel" value={booking.phone} onChange={(event) => setBooking({ ...booking, phone: event.target.value })} placeholder="+855 ..." /></label>
                </div>
                {error && <p className="notice error-notice">{error}</p>}
                {notice && <p className="notice success-notice">{notice}</p>}
                <button className="search-button submit-button" type="submit">បញ្ជាក់ការកក់ <span>→</span></button>
              </>
            ) : (
              <div className="booking-placeholder">
                {notice ? <p className="notice success-notice">{notice}</p> : <><span className="placeholder-icon">✳</span><p>ជ្រើសរើសបន្ទប់ដែលអ្នកចូលចិត្ត<br />ដើម្បីបន្តការកក់។</p><a href="#stay">មើលបន្ទប់ទាំងអស់ ↗</a></>}
              </div>
            )}
          </form>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home"><span className="brand-mark">S</span><span>SOKHA <b>HAVEN</b><small>STAY A LITTLE CLOSER</small></span></a>
        <span>© 2026 Sokha Haven. សិទ្ធិគ្រប់យ៉ាងត្រូវបានរក្សា។</span>
        <a href="mailto:hello@sokhahaven.example">hello@sokhahaven.example</a>
      </footer>
      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </>
  );
}

function AdminPanel({ onClose }) {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", description: "", image: "", price: "", capacity: 2, amenities: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  async function refresh() {
    setError("");
    try {
      const [roomData, bookingData] = await Promise.all([
        request("/api/admin/rooms", { headers }),
        request("/api/admin/bookings", { headers }),
      ]);
      setRooms(roomData);
      setBookings(bookingData);
      setAuthenticated(true);
    } catch (reason) {
      setAuthenticated(false);
      setError(reason.message);
    }
  }

  async function saveRoom(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/rooms", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          capacity: Number(form.capacity),
          amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      });
      setForm({ name: "", category: "", description: "", image: "", price: "", capacity: 2, amenities: "" });
      await refresh();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateBooking(id, status) {
    setError("");
    try {
      await request(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (reason) {
      setError(reason.message);
    }
  }

  async function toggleRoom(room) {
    setError("");
    try {
      await request(`/api/admin/rooms/${room.id}/availability?active=${!room.active}`, {
        method: "PATCH",
        headers,
      });
      await refresh();
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-title">
        <div className="admin-heading"><div><p className="eyebrow">SOKHA HAVEN</p><h2 id="admin-title">ការគ្រប់គ្រង</h2></div><button className="close-button" onClick={onClose} aria-label="បិទ">×</button></div>
        {!authenticated ? (
          <form className="admin-login" onSubmit={(event) => { event.preventDefault(); refresh(); }}>
            <p>បញ្ចូល admin token ដើម្បីគ្រប់គ្រងបន្ទប់ និងការកក់។</p>
            <label>Admin token<input required type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="បញ្ចូល token" /></label>
            {error && <p className="notice error-notice">{error}</p>}
            <button className="search-button" type="submit">ចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង <span>→</span></button>
          </form>
        ) : (
          <div className="admin-content">
            {error && <p className="notice error-notice">{error}</p>}
            <div className="admin-columns">
              <div>
                <h3>បន្ថែមបន្ទប់</h3>
                <form className="admin-room-form" onSubmit={saveRoom}>
                  <input required minLength="2" placeholder="ឈ្មោះបន្ទប់" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                  <input required placeholder="ប្រភេទបន្ទប់" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
                  <textarea required minLength="10" placeholder="ការពិពណ៌នា" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                  <input required type="url" placeholder="URL រូបភាព" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
                  <div className="admin-form-row">
                    <input required type="number" min="1" placeholder="តម្លៃ / យប់" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
                    <input required type="number" min="1" max="20" placeholder="ចំនួនភ្ញៀវ" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
                  </div>
                  <input required placeholder="សេវាកម្ម (បំបែកដោយក្បៀស)" value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
                  <button className="search-button" disabled={busy}>{busy ? "កំពុងរក្សាទុក..." : "បន្ថែមបន្ទប់"} <span>→</span></button>
                </form>
                <h3 className="admin-subhead">បន្ទប់ ({rooms.length})</h3>
                <div className="admin-list">
                  {rooms.map((room) => <div className="admin-list-row" key={room.id}><span>{room.name}<small>{currency.format(room.price)} / យប់</small></span><button className="status-toggle" onClick={() => toggleRoom(room)}>{room.active ? "បិទការលក់" : "បើកដំណើរការ"}</button></div>)}
                </div>
              </div>
              <div>
                <h3>ការកក់ ({bookings.length})</h3>
                <div className="admin-list bookings-list">
                  {bookings.map((item) => <div className="booking-admin-card" key={item.id}>
                    <div className="booking-admin-top"><b>#{item.id} · {item.guest_name}</b><span className={`status-badge ${item.status}`}>{item.status}</span></div>
                    <p>{item.room_name} · {item.check_in} → {item.check_out}</p>
                    <small>{item.email} · {item.phone} · {item.guests} នាក់</small>
                    <div className="booking-actions">
                      {item.status === "pending" && <button onClick={() => updateBooking(item.id, "confirmed")}>បញ្ជាក់</button>}
                      {item.status !== "cancelled" && item.status !== "completed" && <button onClick={() => updateBooking(item.id, "cancelled")}>បោះបង់</button>}
                      {item.status === "confirmed" && <button onClick={() => updateBooking(item.id, "completed")}>បានបញ្ចប់</button>}
                    </div>
                  </div>)}
                  {!bookings.length && <p className="admin-empty">មិនទាន់មានការកក់នៅឡើយទេ។</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
