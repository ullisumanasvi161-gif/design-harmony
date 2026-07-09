import { useMemo, useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Grid2X2,
  HeartHandshake,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  MoveRight,
  Phone,
  Play,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  X
} from "lucide-react";
import Logo from "../components/Logo";
import Reveal from "../components/Reveal";
import { api } from "../api";
import { company, process, projects, services } from "../data";
import { useAuth } from "../App";
import { supabase } from "../supabase";

const nav = [
  ["/", "Home"],
  ["/about", "Studio"],
  ["/services", "Services"],
  ["/projects", "Projects"],
  ["/design-planner", "Design Planner"],
  ["/contact", "Contact"]
];

const SectionHead = ({ eyebrow, title, copy, dark = false }) => (
  <Reveal className={`section-head ${dark ? "section-head--dark" : ""}`}>
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {copy && <p>{copy}</p>}
  </Reveal>
);

function usePublishedServices() {
  const [serverServices, setServerServices] = useState([]);

  useEffect(() => {
    api.publicContent()
      .then((data) => setServerServices(data.services || []))
      .catch(() => setServerServices([]));
  }, []);

  return useMemo(
    () => {
      const originalServices = services.map((service, index) => {
        const remote = serverServices[index];
        return {
          ...service,
          serverId: remote?.id || `s${index + 1}`,
          image: remote?.image || service.image,
          gallery: remote?.gallery?.length ? remote.gallery : [{ url: remote?.image || service.image, name: service.title }]
        };
      });
      const extraServices = serverServices.slice(services.length).map((remote, index) => ({
        icon: Sparkles,
        number: String(services.length + index + 1).padStart(2, "0"),
        title: remote.title,
        copy: remote.copy || "A tailored interior service managed by the Design Harmony studio.",
        serverId: remote.id,
        image: remote.image || "/hero-interior.png",
        gallery: remote.gallery?.length ? remote.gallery : [{ url: remote.image || "/hero-interior.png", name: remote.title }]
      }));
      return [...originalServices, ...extraServices];
    },
    [serverServices]
  );
}

function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const publishedServices = usePublishedServices();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const isLightBgPage = ["/projects", "/preview", "/contact", "/consultation"].includes(location.pathname);
  const shouldBeScrolled = scrolled || isLightBgPage;
  const isTeamUser = ["admin", "staff"].includes(user?.role);
  const accountPath = user ? (isTeamUser ? "/portal" : "/consultation") : "/login?mode=register";
  const accountLabel = user ? (isTeamUser ? "Dashboard" : "Book now") : "Sign up & book";

  return (
    <div className="site-shell">
      <header className={`nav-wrap ${shouldBeScrolled ? "nav-wrap--scrolled" : ""}`}>
        <Logo />
        <nav className={open ? "nav-links open" : "nav-links"}>
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} end={to === "/"}>
              {label}
            </NavLink>
          ))}
          <Link className="nav-mobile-cta" to="/consultation" onClick={() => setOpen(false)}>
            Book a consultation
          </Link>
        </nav>
        <div className="nav-actions">
          <Link className="portal-link" to={accountPath}>
            <CircleUserRound size={18} />
            {accountLabel}
          </Link>
          <Link className="button button--nav" to="/consultation">
            Let's talk <ArrowUpRightIcon />
          </Link>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-intro">
            <Logo />
            <p>Thoughtful interiors, beautifully executed across Hyderabad.</p>
            <div className="socials">
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
              <a href={`mailto:${company.email}`} aria-label="Email"><Mail size={18} /></a>
            </div>
          </div>
          <div className="footer-col">
            <span>Explore</span>
            {nav.slice(1).map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          </div>
          <div className="footer-col">
            <span>Services</span>
            {publishedServices.slice(0, 5).map((service) => <Link key={service.number} to="/services">{service.title}</Link>)}
          </div>
          <div className="footer-contact">
            <span>Start a project</span>
            <a className="footer-email" href={`mailto:${company.email}`}>{company.email}</a>
            <p>{company.address}</p>
            <div>{company.phones.map((phone) => <a key={phone} href={`tel:+91${phone}`}>+91 {phone}</a>)}</div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Design Harmony. Crafted in Hyderabad.</span>
          <span>Privacy · Terms</span>
        </div>
      </footer>
      <a
        className="whatsapp"
        href="https://wa.me/917013162157?text=Hello%20Design%20Harmony%2C%20I%27d%20like%20to%20discuss%20an%20interior%20project."
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={22} />
        <span>Let's chat</span>
      </a>
    </div>
  );
}

function ArrowUpRightIcon() {
  return <ArrowDownRight className="up-right" size={17} />;
}

export function Home() {
  const publishedServices = usePublishedServices();
  const [projectImages, setProjectImages] = useState({});

  useEffect(() => {
    api.publicContent()
      .then((data) => {
        if (data.settings?.projectImages) {
          setProjectImages(data.settings.projectImages);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <img className="hero-image" src="/hero-interior.png" alt="Design Harmony luxury living room" />
        <div className="hero-shade" />
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <span className="eyebrow eyebrow--light">Interior architecture · Hyderabad</span>
          <h1>Spaces with<br /><em>quiet character.</em></h1>
          <p>Premium interior design and complete home solutions, thoughtfully conceived and impeccably executed.</p>
          <div className="hero-actions">
            <Link className="button button--light" to="/consultation">Book free consultation <ArrowRight size={18} /></Link>
            <Link className="text-link text-link--light" to="/projects">View our projects <MoveRight size={18} /></Link>
          </div>
        </motion.div>
        <div className="hero-meta">
          <span>Residential</span><i />
          <span>Commercial</span><i />
          <span>Turnkey</span>
        </div>
        <a className="scroll-cue" href="#intro"><span>Explore</span><ArrowDownRight /></a>
      </section>

      <section className="intro section" id="intro">
        <Reveal className="intro-number">
          <span>Since 2014</span>
          <strong>12<sup>+</sup></strong>
          <p>Years shaping meaningful spaces</p>
        </Reveal>
        <Reveal className="intro-copy" delay={0.1}>
          <span className="eyebrow">Our point of view</span>
          <h2>Your home should feel<br />like <em>you</em>—only clearer.</h2>
          <p>We design from the inside out: beginning with how you move, gather, rest and work. The result is less about a signature style and more about a space that belongs completely to you.</p>
          <Link className="text-link" to="/about">Meet the studio <ArrowRight size={17} /></Link>
        </Reveal>
      </section>

      <section className="services-home section section--linen">
        <div className="section-row">
          <SectionHead eyebrow="What we do" title={<>One studio.<br />Every detail.</>} />
          <Reveal><Link className="text-link" to="/services">View all services <ArrowRight size={17} /></Link></Reveal>
        </div>
        <div className="service-grid service-grid--home">
          {publishedServices.slice(0, 6).map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal className="service-card" key={service.number} delay={(index % 3) * 0.08}>
                {service.image && (
                  <div className="service-card-bg">
                    <img src={service.image} alt={service.title} />
                    <div className="service-card-overlay" />
                  </div>
                )}
                <div className="service-card-top"><span>{service.number}</span><Icon size={25} strokeWidth={1.4} /></div>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
                <Link to="/services" aria-label={`Explore ${service.title}`}><ArrowDownRight /></Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="featured section">
        <SectionHead eyebrow="Selected work" title={<>Homes that hold<br /><em>a point of view.</em></>} copy="A few of the spaces we have had the privilege to shape." />
        <div className="featured-grid">
          {projects.slice(0, 3).map((project, index) => (
            <Reveal className={`project-tile project-tile--${index + 1}`} key={project.title} delay={index * 0.08}>
              <img src={projectImages[project.title] || project.image} alt={project.title} />
              <div className="project-overlay">
                <span>{project.category} · {project.location}</span>
                <h3>{project.title}</h3>
                <div><small>{project.metric}</small><ArrowDownRight /></div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="center-action"><Link className="button button--outline" to="/projects">Explore all projects <ArrowRight size={18} /></Link></Reveal>
      </section>

      <section className="process section section--dark">
        <SectionHead dark eyebrow="How it unfolds" title={<>From first conversation<br />to <em>final cushion.</em></>} />
        <div className="process-grid">
          {process.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal className="process-step" key={step.number} delay={index * 0.08}>
                <div><span>{step.number}</span><Icon size={23} /></div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="preview-teaser section">
        <Reveal className="preview-copy">
          <span className="eyebrow">Plan your dream space</span>
          <h2>Find your perfect design direction.</h2>
          <p>Answer a few quick questions to get a personalized interior design planner and approximate budget estimate for your home.</p>
          <Link className="button button--dark" to="/design-planner"><Sparkles size={16} fill="currentColor" /> Try Design Planner</Link>
        </Reveal>
        <Reveal className="preview-canvas-wrap" delay={0.12}>
          <div className="planner-teaser-card" style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            padding: "35px",
            borderRadius: "12px",
            boxShadow: "var(--shadow-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow" style={{ margin: 0 }}>Design Direction</span>
              <span style={{ fontSize: "11px", background: "#f2ede4", padding: "4px 8px", borderRadius: "100px", fontWeight: "600" }}>Japandi Style</span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{ display: "inline-block", width: "30px", height: "30px", borderRadius: "50%", background: "#f7f5f0" }} />
              <span style={{ display: "inline-block", width: "30px", height: "30px", borderRadius: "50%", background: "#eadecc" }} />
              <span style={{ display: "inline-block", width: "30px", height: "30px", borderRadius: "50%", background: "#d2bda6" }} />
              <span style={{ display: "inline-block", width: "30px", height: "30px", borderRadius: "50%", background: "#9e8a75" }} />
            </div>
            <p style={{ fontSize: "13px", color: "var(--fg-muted)", margin: 0, lineHeight: "1.6" }}>
              A blend of Japanese minimalism and Scandinavian warmth, featuring warm oak, cream linen, and textured bouclé.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line)", paddingTop: "15px", fontSize: "12px" }}>
              <div><span style={{ color: "var(--fg-muted)" }}>Estimate:</span> <strong style={{ display: "block" }}>₹7L - ₹15L</strong></div>
              <div><span style={{ color: "var(--fg-muted)" }}>Timeline:</span> <strong style={{ display: "block" }}>6-8 Weeks</strong></div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="testimonial section section--linen">
        <Reveal className="quote-mark"><Quote /></Reveal>
        <Reveal className="testimonial-copy">
          <div className="stars">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} fill="currentColor" />)}</div>
          <blockquote>“They translated how we wanted our home to feel, not just how it should look. The execution was beautifully managed.”</blockquote>
          <div><strong>Madhavi & Arjun</strong><span>Homeowners · Manikonda</span></div>
        </Reveal>
        <Reveal className="testimonial-stat">
          <strong>4.9</strong><span>Average client rating</span>
          <div className="avatar-row"><i>MR</i><i>SV</i><i>AS</i><i>+</i></div>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}

export function About() {
  return (
    <>
      <PageHero eyebrow="The studio" title={<>Design for life,<br /><em>not for display.</em></>} copy="We are a Hyderabad-based interior design and execution studio creating enduring residential and commercial spaces." image="/office.png" />
      <section className="about-story section">
        <Reveal className="about-lead"><span className="eyebrow">Our story</span><h2>A small studio with a whole-home perspective.</h2></Reveal>
        <Reveal className="about-body">
          <p>Design Harmony was founded on a simple belief: a beautifully designed space should also make daily life easier. We combine interior architecture, custom furniture, material intelligence and meticulous site execution under one roof.</p>
          <p>Led by <strong>{company.owner}</strong>, our team stays close to every project—from the first hand sketch to the final handover. That continuity means fewer compromises, clearer communication and a result that feels resolved.</p>
        </Reveal>
      </section>
      <section className="values section section--linen">
        <SectionHead eyebrow="What guides us" title="Clarity in every decision." />
        <div className="value-grid">
          {[
            [HeartHandshake, "Listen first", "We begin with your routines, tastes and non-negotiables—not a preset aesthetic."],
            [Award, "Craft over fashion", "We favour honest materials, balanced proportions and details that age gracefully."],
            [ShieldCheck, "Own the outcome", "One accountable team manages drawings, budgets, vendors, quality and timelines."],
            [Clock3, "Respect the process", "Transparent milestones keep you informed without making the project your second job."]
          ].map(([Icon, title, copy], index) => (
            <Reveal className="value-card" key={title} delay={index * 0.08}><Icon /><h3>{title}</h3><p>{copy}</p></Reveal>
          ))}
        </div>
      </section>
      <section className="numbers section section--dark">
        {[[12, "Years of experience"], [180, "Spaces delivered"], [92, "Local craft partners"], [4.9, "Client rating"]].map(([number, label]) => (
          <Reveal key={label}><strong>{number}{Number.isInteger(number) && "+"}</strong><span>{label}</span></Reveal>
        ))}
      </section>
      <section className="mission section">
        <Reveal className="mission-card"><span>Our mission</span><h2>Make considered design feel attainable, transparent and deeply personal.</h2></Reveal>
        <Reveal className="mission-card mission-card--image"><img src="/bedroom.png" alt="Warm bedroom interior" /></Reveal>
        <Reveal className="mission-card mission-card--accent"><span>Our vision</span><h3>To be Hyderabad’s most trusted studio for quietly exceptional, completely managed interiors.</h3></Reveal>
      </section>
      <CtaBand />
    </>
  );
}

export function Services() {
  const publishedServices = usePublishedServices();
  const [previewService, setPreviewService] = useState(null);

  return (
    <>
      <PageHero eyebrow="Our expertise" title={<>From empty shell<br />to <em>finished home.</em></>} copy="Design, visualization, procurement and execution—one coordinated team, one clear process." image="/kitchen.png" />
      <section className="section services-page">
        <SectionHead eyebrow="Nine ways we can help" title="Every room. Every layer." />
        <div className="service-grid service-grid--full">
          {publishedServices.map((service, index) => {
            const Icon = service.icon;
            const workPhotos = service.gallery?.length ? service.gallery : [{ url: service.image, name: service.title }];
            return (
              <Reveal className="service-card service-card--large service-card--bookable" key={service.number} delay={(index % 3) * 0.06}>
                {service.image && (
                  <div className="service-card-bg">
                    <img src={service.image} alt={service.title} />
                    <div className="service-card-overlay" />
                  </div>
                )}
                <div className="service-card-top"><span>{service.number}</span><Icon size={29} strokeWidth={1.3} /></div>
                <h3>{service.title}</h3><p>{service.copy}</p>
                <ul><li><Check size={14} /> Bespoke planning</li><li><Check size={14} /> Material curation</li><li><Check size={14} /> Managed execution</li></ul>
                <button className="service-work-strip" type="button" onClick={() => setPreviewService(service)}>
                  {workPhotos.slice(0, 3).map((photo, photoIndex) => <img key={`${photo.url}-${photoIndex}`} src={photo.url} alt={`${service.title} previous work ${photoIndex + 1}`} />)}
                  <span>{workPhotos.length > 1 ? `${workPhotos.length} work photos` : "Preview work"}</span>
                </button>
                <div className="service-card-actions">
                  <button className="service-preview-action" type="button" onClick={() => setPreviewService(service)}>Preview work <ChevronRight size={15} /></button>
                  <Link className="service-book-action" to={`/consultation?service=${encodeURIComponent(service.title)}`}>Book this service <ArrowRight size={15} /></Link>
                </div>
              </Reveal>
            );
          })}
        </div>
        {previewService && <ServiceWorkModal service={previewService} onClose={() => setPreviewService(null)} />}
      </section>
      <section className="scope section section--dark">
        <Reveal><span className="eyebrow eyebrow--light">Our promise</span><h2>What stays consistent,<br />whatever the scope.</h2></Reveal>
        <div>
          {["A dedicated project lead", "Itemised, transparent estimates", "Photoreal 3D design previews", "Weekly progress reporting", "Multi-stage quality checks", "Post-handover support"].map((item, index) => (
            <Reveal className="scope-item" key={item} delay={index * 0.04}><span>0{index + 1}</span><p>{item}</p><Check /></Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function ServiceWorkModal({ service, onClose }) {
  const photos = service.gallery?.length ? service.gallery : [{ url: service.image, name: service.title }];

  return (
    <div className="service-work-modal" role="dialog" aria-modal="true" aria-label={`${service.title} previous work preview`} onClick={onClose}>
      <div className="service-work-modal__panel" onClick={(event) => event.stopPropagation()}>
        <button className="service-work-modal__close" type="button" onClick={onClose} aria-label="Close preview"><X size={20} /></button>
        <span className="eyebrow">Previous client work</span>
        <h2>{service.title}</h2>
        <p>Browse photos uploaded by the studio team for this service. These help customers understand the finish, scale and style of completed work.</p>
        <div className="service-work-gallery">
          {photos.map((photo, index) => <img key={`${photo.url}-${index}`} src={photo.url} alt={`${service.title} completed work ${index + 1}`} />)}
        </div>
        <div className="service-work-modal__actions">
          <Link className="button button--dark" to={`/consultation?service=${encodeURIComponent(service.title)}`} onClick={onClose}>Book this service <ArrowRight size={16} /></Link>
          <button className="button button--outline" type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function Portfolio() {
  const [filter, setFilter] = useState("All");
  const [projectImages, setProjectImages] = useState({});

  useEffect(() => {
    api.publicContent()
      .then((data) => {
        if (data.settings?.projectImages) {
          setProjectImages(data.settings.projectImages);
        }
      })
      .catch(() => {});
  }, []);

  const categories = ["All", "Complete Home", "Modular Kitchen", "Bedroom", "Office"];
  const filtered = filter === "All" ? projects : projects.filter((project) => project.category === filter);
  return (
    <>
      <div className="page-intro">
        <Reveal><span className="eyebrow">Selected work</span><h1>Spaces that feel<br /><em>distinctly lived in.</em></h1></Reveal>
        <Reveal><p>Every project begins with a different life. The result should look that way, too.</p></Reveal>
      </div>
      <section className="portfolio section">
        <div className="filter-row">
          {categories.map((category) => <button className={filter === category ? "active" : ""} onClick={() => setFilter(category)} key={category}>{category}</button>)}
        </div>
        <motion.div className="portfolio-grid" layout>
          {filtered.map((project, index) => (
            <motion.article className="portfolio-card" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={project.title}>
              <div className="portfolio-image">
                <img src={projectImages[project.title] || project.image} alt={project.title} />
                <span>{project.status}</span>
                <button><ArrowDownRight /></button>
              </div>
              <div className="portfolio-info"><div><span>{project.category}</span><h2>{project.title}</h2></div><dl><div><dt>Location</dt><dd>{project.location}</dd></div><div><dt>Scale</dt><dd>{project.metric}</dd></div><div><dt>Investment</dt><dd>{project.budget}</dd></div></dl></div>
            </motion.article>
          ))}
        </motion.div>
      </section>
      <BeforeAfter />
      <CtaBand />
    </>
  );
}

function BeforeAfter() {
  const [position, setPosition] = useState(56);
  return (
    <section className="before-after section section--linen">
      <SectionHead eyebrow="The transformation" title="Drag to see the difference." copy="From a raw shell to a space with rhythm, warmth and purpose." />
      <Reveal className="compare">
        <img src="/hero-interior.png" alt="Finished interior" />
        <div className="compare-before" style={{ width: `${position}%` }}>
          <img src="/hero-interior.png" alt="Interior before visualization" />
        </div>
        <input aria-label="Before and after slider" type="range" min="5" max="95" value={position} onChange={(event) => setPosition(event.target.value)} />
        <div className="compare-line" style={{ left: `${position}%` }}><span>↔</span></div>
        <b className="before-label">Concept</b><b className="after-label">Completed</b>
      </Reveal>
    </section>
  );
}

export function DesignPlanner() {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    room: "",
    style: "",
    budget: "",
    mood: ""
  });

  const roomsList = ["Living Room", "Kitchen", "Bedroom", "Office", "Full Home"];
  const stylesList = ["Warm Modern", "Luxury Minimal", "Classic Elegant", "Japandi", "Contemporary"];
  const budgetsList = ["₹1L - ₹3L", "₹3L - ₹7L", "₹7L - ₹15L", "₹15L+"];
  const moodsList = ["Calm Neutral", "Rich Wooden", "Bright & Airy", "Dark Luxury"];

  const styleData = {
    "Warm Modern": {
      name: "Warm Modernism",
      desc: "A timeless blend of natural dark walnut grains, clean linear forms, and soft cozy textiles. Focuses on warmth, scale, and rich material contrasts.",
      colors: ["#563927", "#d7c6ad", "#a78352", "#9d8b75", "#f5ebe0"],
      materials: ["American Walnut", "Textured Bouclé", "Satin Brass", "Fluted Panels"]
    },
    "Luxury Minimal": {
      name: "Luxury Minimalism",
      desc: "Sleek, uncluttered layouts utilizing monolithic stone volumes, refined matte-black metals, and custom seamless joinery.",
      colors: ["#1f201e", "#eadecc", "#4b3c32", "#6e6a62", "#dcd0c0"],
      materials: ["Carrara Marble", "Matte Black Steel", "Smoked Oak", "Micro-cement"]
    },
    "Classic Elegant": {
      name: "Classic Elegance",
      desc: "Symmetrical proportions, fluted wall mouldings, rich velvet upholsteries, and glowing gold details. Balanced, sophisticated, and stately.",
      colors: ["#aa9882", "#c5a059", "#423d38", "#f5ebe0", "#ebe3d5"],
      materials: ["Calacatta Gold Marble", "Velvet Fabric", "Wall Mouldings", "Polished Brass"]
    },
    "Japandi": {
      name: "Japandi Harmony",
      desc: "A serene fusion of Japanese wabi-sabi simplicity and Scandinavian rustic warmth. Emphasizes organic shapes, raw textures, and light oaks.",
      colors: ["#f7f5f0", "#eadecc", "#d2bda6", "#9e8a75", "#e3ded5"],
      materials: ["White-washed Oak", "Natural Rattan", "Bouclé Fabric", "Wabi-sabi Ceramics"]
    },
    "Contemporary": {
      name: "Contemporary Chic",
      desc: "A bold, current style combining curved architectural geometries, fluted glass partitions, and textured micro-cement wall coatings.",
      colors: ["#3a3b38", "#c8b79f", "#b0884d", "#765844", "#92806c"],
      materials: ["Fluted Glass", "Engineered Quartz", "Brushed Bronze", "Polished Plaster"]
    }
  };

  const getInspirationImage = () => {
    switch (selections.room) {
      case "Kitchen": return "/kitchen.png";
      case "Bedroom": return "/bedroom.png";
      case "Office": return "/office.png";
      default: return "/hero-interior.png";
    }
  };

  const handleSelect = (field, value) => {
    setSelections(prev => ({ ...prev, [field]: value }));
    setStep(prev => prev + 1);
  };

  const getWhatsAppLink = () => {
    const text = `Hello Design Harmony! I just completed my AI Design Plan on your website:

- Room: ${selections.room}
- Style: ${selections.style}
- Budget: ${selections.budget}
- Mood: ${selections.mood}

Recommended Direction: ${styleData[selections.style]?.name || selections.style}
Approx. Budget: ${selections.budget}

I'd like to schedule a free consultation to discuss this plan.`;
    return `https://wa.me/917013162157?text=${encodeURIComponent(text)}`;
  };

  const activeStyle = styleData[selections.style || "Warm Modern"];
  const currentImage = getInspirationImage();

  return (
    <>
      <div className="page-intro page-intro--preview">
        <Reveal><span className="eyebrow">Interactive Space Configurator</span><h1>Plan Your<br /><em>Dream Space.</em></h1></Reveal>
        <Reveal><p>Answer a few quick questions and get a personalized interior design direction, budget estimate, and material palette for your home.</p></Reveal>
      </div>

      <section className="planner-section section">
        <div className="planner-grid">
          {/* Left Column: Form/Card UI */}
          <div className="planner-main-card">
            {step <= 4 ? (
              <div className="planner-step-container">
                <div className="planner-progress-bar">
                  <div className="planner-progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
                </div>
                
                {step > 1 && (
                  <button type="button" className="planner-back-btn" onClick={() => setStep(prev => prev - 1)}>
                    <ArrowLeft size={16} /> Back to Step {step - 1}
                  </button>
                )}

                {step === 1 && (
                  <div>
                    <span className="eyebrow">Step 1 of 4</span>
                    <h2>Which room are we planning?</h2>
                    <div className="options-grid">
                      {roomsList.map(r => (
                        <button key={r} type="button" className="option-button" onClick={() => handleSelect("room", r)}>
                          <span>{r}</span>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <span className="eyebrow">Step 2 of 4</span>
                    <h2>Choose your preferred style</h2>
                    <div className="options-grid">
                      {stylesList.map(s => (
                        <button key={s} type="button" className="option-button" onClick={() => handleSelect("style", s)}>
                          <span>{s}</span>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <span className="eyebrow">Step 3 of 4</span>
                    <h2>Select your budget range</h2>
                    <div className="options-grid">
                      {budgetsList.map(b => (
                        <button key={b} type="button" className="option-button" onClick={() => handleSelect("budget", b)}>
                          <span>{b}</span>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <span className="eyebrow">Step 4 of 4</span>
                    <h2>What mood fits your space?</h2>
                    <div className="options-grid">
                      {moodsList.map(m => (
                        <button key={m} type="button" className="option-button" onClick={() => handleSelect("mood", m)}>
                          <span>{m}</span>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Step 5: Result Card
              <div className="planner-result-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                  <span className="eyebrow" style={{ color: "var(--gold)", margin: 0 }}>Your Personalized Plan</span>
                  <button type="button" className="text-link" onClick={() => { setStep(1); setSelections({ room: "", style: "", budget: "", mood: "" }); }} style={{ fontSize: "11px" }}>
                    Start Over
                  </button>
                </div>
                
                <h2>Warm Modern {selections.room}</h2>
                <p style={{ color: "var(--fg-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "25px" }}>
                  Based on your preferences, we recommend a {activeStyle.name} direction tailored to a {selections.mood.toLowerCase()} mood.
                </p>

                <div className="result-details-grid">
                  <div>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--fg-muted)", display: "block", marginBottom: "4px" }}>Design Style</span>
                    <strong style={{ fontSize: "16px" }}>{activeStyle.name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--fg-muted)", display: "block", marginBottom: "4px" }}>Approx. Budget</span>
                    <strong style={{ fontSize: "16px" }}>{selections.budget}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--fg-muted)", display: "block", marginBottom: "4px" }}>Estimated Timeline</span>
                    <strong style={{ fontSize: "16px" }}>{activeStyle.timeline || "6-8 Weeks"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--fg-muted)", display: "block", marginBottom: "4px" }}>Recommended Next Step</span>
                    <strong style={{ fontSize: "16px", color: "var(--gold)", fontWeight: "500" }}>Book a Walkthrough</strong>
                  </div>
                </div>

                <div style={{ marginTop: "30px", borderTop: "1px solid var(--line)", paddingTop: "25px" }}>
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", marginBottom: "15px" }}>Recommended Materials</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "35px" }}>
                    {activeStyle.materials.map(mat => (
                      <span key={mat} style={{ padding: "6px 12px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "12px" }}>
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="planner-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <Link className="button button--dark" to={`/consultation?service=Design%20Planner&room=${encodeURIComponent(selections.room)}`} style={{ justifyContent: "center" }}>
                    Book Consultation <ArrowRight size={16} />
                  </Link>
                  <a className="button button--outline" href={getWhatsAppLink()} target="_blank" rel="noreferrer" style={{ justifyContent: "center", gap: "8px" }}>
                    <MessageCircle size={16} fill="currentColor" /> Send on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visual Moodboard Card */}
          <div className="planner-visual-card">
            <div className="visual-image-wrapper">
              <img src={currentImage} alt="Space Preview" />
              <div className="visual-badge">
                <span>{selections.room || "Room Select"}</span>
              </div>
            </div>
            
            <div className="visual-moodboard-details">
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: "24px", margin: "0 0 15px 0" }}>Moodboard Materials</h3>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                {(activeStyle.materials).map(mat => (
                  <div key={mat} style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--card)", padding: "5px 12px", borderRadius: "100px", border: "1px solid var(--line)" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold)" }} />
                    <span style={{ fontSize: "11px", fontWeight: "500" }}>{mat}</span>
                  </div>
                ))}
              </div>

              <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--fg-muted)", margin: "0 0 10px 0" }}>Suggested Color Palette</h4>
              <div style={{ display: "flex", gap: "12px", marginBottom: "25px" }}>
                {activeStyle.colors.map(col => (
                  <span key={col} style={{ width: "24px", height: "24px", borderRadius: "50%", background: col, border: "1px solid var(--line)" }} />
                ))}
              </div>

              <div className="package-banner" style={{ background: "var(--line)", padding: "15px", borderRadius: "8px", fontSize: "12px" }}>
                <span style={{ textTransform: "uppercase", fontSize: "10px", color: "var(--fg-muted)", display: "block" }}>Estimated Package</span>
                <strong style={{ display: "block", fontSize: "16px", margin: "2px 0 6px 0" }}>Premium Custom Turnkey</strong>
                <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "11px", lineHeight: "1.5" }}>Includes structural design, materials sourcing, carpentry, and site supervisor oversight.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="preview-benefits section section--linen">
        {[
          ["01", "Plan with clarity", "Answer quick questions and receive a custom direction for your space."],
          ["02", "Instant budget scoping", "Understand approximate turnkey packages and timeframes instantly."],
          ["03", "One click sharing", "Send your design parameters to our team on WhatsApp for a fast start."]
        ].map(([number, title, copy]) => <Reveal key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}
      </section>
      <CtaBand />
    </>
  );
}

export function Consultation() {
  const [state, setState] = useState({ status: "idle", message: "", whatsapp: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const publishedServices = usePublishedServices();
  const selectedService = useMemo(() => new URLSearchParams(location.search).get("service") || "", [location.search]);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ status: "loading", message: "", whatsapp: "" });
    const body = Object.fromEntries(new FormData(form));
    if (user?.id) body.customerId = user.id;
    const name = body.name || "a customer";
    const projectType = body.projectType || "an interior project";
    const whatsapp = `https://wa.me/91${company.phones[0]}?text=${encodeURIComponent(`Hello Design Harmony, I just booked a consultation for ${projectType}. My name is ${name}.`)}`;
    try {
      await api.booking(body);
      
      try {
        const { error: supabaseError } = await supabase.from("consultation_requests").insert([{
          name: body.name,
          email: body.email || null,
          phone: body.mobile,
          message: `Project Location: ${body.location || "N/A"}
Project Type: ${body.projectType || "N/A"}
Budget: ${body.budget || "N/A"}
Preferred Date: ${body.preferredDate || "N/A"}

Client Note:
${body.message || "None"}`
        }]);
        if (supabaseError) console.error("Supabase insert error:", supabaseError);
      } catch (err) {
        console.error("Supabase connection error:", err);
      }

      form.reset();
      setState({ status: "success", message: "Your consultation is booked. We’ll call you within one business day." });
      setState({ status: "success", message: "Your consultation is booked. You can now chat with the owner or staff on WhatsApp.", whatsapp });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }
  return (
    <section className="form-page">
      <div className="form-aside">
        <Logo />
        <div><span className="eyebrow eyebrow--light">Complimentary design call</span><h1>Tell us about<br />your <em>space.</em></h1><p>A thoughtful project starts with a good conversation. Share the broad strokes—we’ll help shape what comes next.</p></div>
        <ul><li><Check /> 30-minute discovery call</li><li><Check /> Initial scope guidance</li><li><Check /> Indicative budget direction</li></ul>
        <button onClick={() => navigate(-1)} className="form-back">← Back to website</button>
      </div>
      <div className="form-main">
        <div className="form-heading"><span>01</span><div><h2>Project essentials</h2><p>Fields marked * are required.</p></div></div>
        <form className="design-form" onSubmit={submit}>
          <label><span>Your name *</span><input required name="name" defaultValue={user?.name || ""} placeholder="e.g. Aditi Rao" /></label>
          <label><span>Contact number *</span><input required name="mobile" type="tel" pattern="[0-9]{10}" defaultValue={user?.phone || ""} placeholder="10-digit contact number" /></label>
          <label><span>Email address</span><input name="email" type="email" defaultValue={user?.email || ""} placeholder="you@example.com" /></label>
          <label><span>Project location *</span><input required name="location" placeholder="Area, city" /></label>
          <label><span>Project type *</span><select required name="projectType" defaultValue={selectedService}><option value="" disabled>Select a service</option>{publishedServices.map((service) => <option key={service.title}>{service.title}</option>)}</select></label>
          <label><span>Indicative budget *</span><select required name="budget" defaultValue=""><option value="" disabled>Select a range</option><option>₹5–10L</option><option>₹10–20L</option><option>₹20–35L</option><option>₹35–50L</option><option>₹50L+</option></select></label>
          <label><span>Preferred date</span><input name="preferredDate" type="date" /></label>
          <label className="full"><span>Anything we should know?</span><textarea name="message" rows="4" placeholder="Tell us about your home, timeline, style or priorities..." /></label>
          <button className="button button--dark full" disabled={state.status === "loading"}>{state.status === "loading" ? "Booking…" : selectedService ? "Book this service" : "Book my free consultation"} <ArrowRight size={18} /></button>
          {state.message && (
            <div className={`form-message ${state.status}`}>
              <span>{state.message}</span>
              {state.whatsapp && <a className="whatsapp-inline" href={state.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Chat on WhatsApp</a>}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

export function Contact() {
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      await api.contact(body);

      try {
        const { error: supabaseError } = await supabase.from("consultation_requests").insert([{
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          message: body.message
        }]);
        if (supabaseError) console.error("Supabase insert error:", supabaseError);
      } catch (err) {
        console.error("Supabase connection error:", err);
      }

      event.currentTarget.reset();
      setMessage("Thank you. Your note is with our studio.");
    } catch (error) {
      setMessage(error.message);
    }
  }
  return (
    <>
      <div className="page-intro">
        <Reveal><span className="eyebrow">Contact the studio</span><h1>Let’s begin with<br /><em>a conversation.</em></h1></Reveal>
        <Reveal><p>Visit, call or write. We’re based in Manikonda and work across Hyderabad.</p></Reveal>
      </div>
      <section className="contact-grid section">
        <Reveal className="contact-details">
          <div><MapPin /><span>Studio</span><p>{company.address}</p></div>
          <div><Phone /><span>Call</span>{company.phones.map((phone) => <a key={phone} href={`tel:+91${phone}`}>+91 {phone}</a>)}</div>
          <div><Mail /><span>Email</span><a href={`mailto:${company.email}`}>{company.email}</a></div>
          <div><Clock3 /><span>Studio hours</span><p>Monday–Saturday<br />10:00 AM–7:00 PM</p></div>
        </Reveal>
        <Reveal className="contact-form-wrap">
          <h2>Send us a note</h2>
          <form className="design-form contact-form" onSubmit={submit}>
            <label><span>Name</span><input required name="name" /></label>
            <label><span>Email</span><input required name="email" type="email" /></label>
            <label className="full"><span>Phone</span><input name="phone" type="tel" /></label>
            <label className="full"><span>Message</span><textarea required name="message" rows="5" /></label>
            <button className="button button--dark full">Send message <ArrowRight size={17} /></button>
            {message && <p className="form-message success">{message}</p>}
          </form>
        </Reveal>
      </section>
      <section className="map-placeholder">
        <div className="map-grid" />
        <div className="map-pin"><MapPin /><strong>Design Harmony</strong><span>Manikonda, Hyderabad</span></div>
      </section>
    </>
  );
}

function PageHero({ eyebrow, title, copy, image }) {
  return (
    <section className="page-hero">
      <img src={image} alt="" />
      <div />
      <motion.article initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
        <span className="eyebrow eyebrow--light">{eyebrow}</span><h1>{title}</h1><p>{copy}</p>
      </motion.article>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="cta-band">
      <Reveal><span className="eyebrow eyebrow--light">Have a space in mind?</span><h2>Let’s make it feel<br /><em>like yours.</em></h2></Reveal>
      <Reveal><p>Tell us a little about your project. The first conversation is complimentary.</p><Link className="button button--light" to="/consultation">Start your project <ArrowRight size={18} /></Link></Reveal>
    </section>
  );
}

export default PublicLayout;
