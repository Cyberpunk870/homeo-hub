import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  FileText, 
  AlertTriangle, 
  BarChart3, 
  Building2, 
  Pill, 
  Search, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Leaf,
  Activity
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// --- Canonical Data Sources ---
// Preserving original data structures while incorporating user assets.

const splashImages = [
  {
    // User provided asset: Logo/Branding
    url: 'https://static.wixstatic.com/media/3fbaca_e0ed6d313c284936a515d045b97f08d4~mv2.jpeg',
    alt: 'Dr. Upadhyaya Homeopathy Logo'
  },
  {
    // User provided asset: Doctors Profile
    url: 'https://static.wixstatic.com/media/3fbaca_e2b4cf1af34e4fb992258cbdf513ae85~mv2.jpeg',
    alt: 'Our Doctors'
  },
  {
    // User provided asset: Clinic Info
    url: 'https://static.wixstatic.com/media/3fbaca_55af41eb68914b3a85b967748f59444a~mv2.jpeg',
    alt: 'Clinic Information and Specialties'
  },
  {
    // Fallback/Additional image to meet the "4 images" request pattern
    url: 'https://static.wixstatic.com/media/3fbaca_f63b2beac20040cfbb1a0e43c1848fbf~mv2.png?originWidth=448&originHeight=448',
    alt: 'Homeopathic Medicine Vials'
  }
];

const quickActions = [
  {
    icon: Pill,
    title: 'Medicine Inventory',
    description: 'Master database of medicines, potencies, and forms.',
    link: '/inventory',
    color: 'primary',
    stat: '2,400+ SKUs'
  },
  {
    icon: Package,
    title: 'Stock Management',
    description: 'Track batches, stock-in, and dispensing logs.',
    link: '/stock-management',
    color: 'secondary',
    stat: 'Live Tracking'
  },
  {
    icon: AlertTriangle,
    title: 'Stock Alerts',
    description: 'Automated low stock and expiry notifications.',
    link: '/alerts',
    color: 'destructive',
    stat: '3 Critical'
  },
  {
    icon: FileText,
    title: 'Prescriptions',
    description: 'Digital prescription entry and patient history.',
    link: '/prescriptions',
    color: 'primary',
    stat: 'Patient Records'
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Consumption trends and inventory valuation.',
    link: '/reports',
    color: 'secondary',
    stat: 'Monthly Insights'
  },
  {
    icon: Building2,
    title: 'Clinic Profile',
    description: 'Manage doctor profiles and clinic locations.',
    link: '/about',
    color: 'primary',
    stat: 'Noida & Delhi'
  }
];

const clinicInfo = {
  specialties: [
    "Migraine", "Respiratory Diseases", "Bone & Joint Diseases", 
    "Gynecological Problems", "Skin & Cosmetic Problems", 
    "Allergies", "Kid's Health", "Thyroid Disorders", 
    "Hair & Scalp Conditions", "Gastrointestinal Disorders"
  ],
  locations: [
    {
      name: "Clinic-1 (Noida)",
      address: "102, Jaipuria Plaza, Sec- 26, Noida",
      phones: ["0120-4295211", "8010877211"]
    },
    {
      name: "Clinic-2 (Delhi)",
      address: "G-16, Vardhman Sun-Rise Plaza, Vasundhara Enclave, Delhi-96",
      phones: ["011-47520627", "9205664653"]
    }
  ]
};

// --- Components ---

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const ParallaxSection = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
        {children}
      </motion.div>
    </div>
  );
};

export default function HomePage() {

  return (
    <div className="min-h-screen bg-background font-paragraph text-foreground selection:bg-primary/20">
      <Header />

      {/* --- Hero Section --- */}
      <section className="relative w-full min-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Navigation - Stacked Horizontally */}
        <nav className="w-full bg-primary border-b border-secondary/30 px-8 py-4">
          <div className="max-w-[120rem] mx-auto flex flex-wrap gap-8 justify-center">
            {[
              { name: 'Inventory', path: '/inventory' },
              { name: 'Stock Management', path: '/stock-management' },
              { name: 'Alerts', path: '/alerts' },
              { name: 'Prescriptions', path: '/prescriptions' },
              { name: 'Reports', path: '/reports' },
              { name: 'About', path: '/about' }
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="font-paragraph text-base text-white hover:text-accent-gold transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Main Hero Content */}
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Left: Content */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-20 py-20 z-10 bg-background/80 backdrop-blur-sm lg:bg-transparent">
            {/* Top Logo Images */}
            <div className="mb-12 flex gap-6 items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg flex-shrink-0"
              >
                <Image
                  src="https://static.wixstatic.com/media/3fbaca_fb69eca258004dabb70a8e7194db7b28~mv2.png"
                  alt="Homeopathic Medicines"
                  width={200}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg flex-shrink-0"
              >
                <Image
                  src="https://static.wixstatic.com/media/3fbaca_247171c8c6594e6581cacd4e6e57215b~mv2.png"
                  alt="Dr. Upadhyaya's Credentials"
                  width={200}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-gold/30 bg-accent-gold/5 text-accent-gold text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-gold"></span>
                </span>
                Clinic Management System
              </div>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <h1 className="font-heading text-6xl lg:text-8xl font-bold leading-[0.9] tracking-tight text-foreground mb-8">
                Dr. Upadhyaya's <br />
                <span className="text-accent-gold italic">Homeopathy</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-xl text-foreground/90 max-w-xl leading-relaxed mb-10 border-l-2 border-accent-gold/30 pl-6">
                Precision inventory tracking meets holistic care. Designed exclusively for 
                <span className="font-semibold text-foreground"> Dr. Upadhyaya's Homeopathy</span>, 
                bridging the gap between ancient wisdom and modern efficiency.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="h-14 px-8 rounded-full bg-accent-gold text-background hover:bg-accent-gold/90 transition-all duration-500 text-lg">
                  <Link to="/inventory">
                    Access Inventory <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-14 px-8 rounded-full border-foreground/20 hover:bg-primary/20 text-lg text-foreground">
                  <Link to="/about">Clinic Profile</Link>
                </Button>
              </div>
            </FadeIn>
          </div>

          {/* Right: Horizontal Carousel with 4 Images */}
          <div className="w-full lg:w-1/2 relative min-h-[50vh] lg:min-h-auto bg-secondary/10 flex items-center justify-center overflow-hidden p-8">
            <div className="w-full flex gap-6 overflow-x-auto pb-4">
              {splashImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-accent-gold shadow-lg"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={300}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Ticker Section --- */}
      <div className="w-full bg-primary text-white py-4 overflow-hidden border-y border-accent-gold/10">
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: "-50%" }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 text-sm uppercase tracking-[0.2em] font-medium opacity-90"
          >
            {Array(10).fill("Holistic Healing • Precision Potency • Natural Care • Dr. Upadhyaya's Homeopathy •").map((text, i) => (
              <span key={i}>{text}</span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- System Modules (Quick Actions) --- */}
      <section className="w-full max-w-[120rem] mx-auto px-4 md:px-8 py-32">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20">
          <div className="max-w-2xl">
            <h2 className="font-heading text-5xl md:text-6xl text-foreground mb-6">
              Clinic Ecosystem
            </h2>
            <p className="text-xl text-foreground/80 font-light">
              A unified interface for managing the complex inventory of homeopathic medicines, 
              patient records, and multi-clinic operations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={action.link} className="group block h-full">
                <div className="relative h-full bg-secondary rounded-2xl p-8 border border-primary/30 hover:border-accent-gold/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/20 overflow-hidden">
                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className={`w-14 h-14 rounded-xl bg-accent-gold/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                        <action.icon className={`w-7 h-7 text-accent-gold`} />
                      </div>
                      <h3 className="font-heading text-2xl text-foreground mb-3 group-hover:text-accent-gold transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-foreground/70 leading-relaxed mb-8">
                        {action.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-primary/20">
                      <span className="text-xs font-bold tracking-wider uppercase text-accent-gold/80">
                        {action.stat}
                      </span>
                      <ArrowRight className="w-5 h-5 text-accent-gold group-hover:text-accent-gold group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- Feature Spotlight: Potency Matrix --- */}
      <section className="w-full bg-secondary py-32 overflow-hidden">
        <div className="max-w-[120rem] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              {/* Abstract UI Representation */}
              <div className="relative z-10 bg-background rounded-xl shadow-2xl border border-primary/20 p-8 max-w-xl mx-auto lg:mx-0 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
                <div className="flex items-center justify-between mb-8 border-b border-primary/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-mono text-foreground/40">POTENCY_MATRIX.EXE</span>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Aconite Napellus", p6: 12, p30: 45, p200: 8 },
                    { name: "Belladonna", p6: 24, p30: 15, p200: 32 },
                    { name: "Arnica Montana", p6: 5, p30: 60, p200: 12 },
                    { name: "Nux Vomica", p6: 18, p30: 22, p200: 4 }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-3 hover:bg-primary/10 rounded-lg transition-colors">
                      <span className="font-medium text-foreground w-1/3">{item.name}</span>
                      <div className="flex gap-2 w-2/3 justify-end">
                        <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold rounded text-xs">6C: {item.p6}</span>
                        <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold rounded text-xs">30C: {item.p30}</span>
                        <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold rounded text-xs">200C: {item.p200}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-4 border-t border-primary/10 flex justify-between items-center">
                  <div className="h-2 w-32 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-accent-gold" />
                  </div>
                  <span className="text-xs text-foreground/50">Stock Level: Optimal</span>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent-gold/10 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 text-accent-gold font-medium tracking-wider uppercase text-sm">
                <Activity className="w-4 h-4" />
                Specialized Inventory
              </div>
              <h2 className="font-heading text-5xl lg:text-6xl text-foreground">
                The Potency Matrix
              </h2>
              <p className="text-xl text-foreground/80 leading-relaxed">
                Homeopathy requires a different dimension of inventory management. 
                Our system tracks not just the medicine, but the intricate matrix of 
                potencies (6C, 30C, 200C, 1M) and forms (Globules, Dilutions, Mother Tinctures).
              </p>
              <ul className="space-y-4">
                {[
                  "Multi-dimensional SKU tracking",
                  "Automated reorder levels per potency",
                  "Batch expiry management",
                  "Small quantity unit support (Drams, ML)"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground/90">
                    <div className="w-6 h-6 rounded-full bg-accent-gold border border-accent-gold/30 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-background" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Clinic Information & Specialties --- */}
      <section className="w-full py-32 bg-background relative">
        <div className="max-w-[120rem] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Content & Locations */}
            <div className="lg:col-span-12 space-y-20">
              
              {/* Specialties */}
              <div>
                <h2 className="font-heading text-4xl text-foreground mb-10">Specialized Treatments</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clinicInfo.specialties.map((spec, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative overflow-hidden p-4 rounded-lg bg-secondary border border-primary/30 hover:border-accent-gold/40 transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                          <Leaf className="w-5 h-5 text-accent-gold/60" />
                          <span className="text-foreground font-medium">{spec}</span>
                        </div>
                        {/* Hidden info on hover */}
                        <div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-300">
                          <p className="text-foreground/80 text-sm mt-3 pt-3 border-t border-primary/20">
                            Expert treatment for {spec.toLowerCase()} using personalized homeopathic remedies and proven therapeutic protocols.
                          </p>
                        </div>
                      </div>
                      {/* Hover background effect */}
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <h2 className="font-heading text-4xl text-foreground mb-10">Our Locations</h2>
                <div className="space-y-8">
                  {clinicInfo.locations.map((loc, i) => (
                    <div key={i} className="bg-secondary p-8 rounded-2xl border border-primary/30">
                      <h3 className="font-heading text-2xl text-accent-gold mb-4">{loc.name}</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <MapPin className="w-6 h-6 text-accent-gold/60 mt-1 flex-shrink-0" />
                          <p className="text-foreground/90 text-lg">{loc.address}</p>
                        </div>
                        <div className="flex items-start gap-4">
                          <Phone className="w-6 h-6 text-accent-gold/60 mt-1 flex-shrink-0" />
                          <div className="flex flex-col">
                            {loc.phones.map((phone, idx) => (
                              <span key={idx} className="text-foreground/90 text-lg">{phone}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- Visual Breather / Parallax --- */}
      <section className="w-full h-[60vh] relative overflow-hidden flex items-center justify-center bg-secondary">
        <ParallaxSection className="absolute inset-0">
          <Image
            src="https://static.wixstatic.com/media/3fbaca_e2b4cf1af34e4fb992258cbdf513ae85~mv2.jpeg"
            alt="Homeopathic Care"
            width={1920}
            className="w-full h-full object-cover opacity-30"
          />
        </ParallaxSection>
        <div className="relative z-10 text-center px-4">
          <h2 className="font-heading text-5xl md:text-7xl text-foreground mb-6">
            Nature's Science.
          </h2>
          <p className="text-xl md:text-2xl text-foreground/80 font-light max-w-2xl mx-auto">
            Restoring balance through precise, individualized treatment plans.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}