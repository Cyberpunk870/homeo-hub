import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Award } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Image } from '@/components/ui/image';
import { Badge } from '@/components/ui/badge';

export default function AboutPage() {
  const treatmentsList = [
    'Migraine',
    'Respiratory Diseases',
    'Bone & Joint Diseases',
    'Gynecological Problems',
    'Skin & Cosmetic Problems',
    'Allergies',
    "Kid's Health",
    'Thyroid Disorders',
    'Hair & Scalp Conditions',
    'Gastrointestinal Disorders'
  ];

  return (
    <DashboardShell
      title="Clinic Profile"
      description="Doctors, treatment coverage, clinic locations, and practice information."
    >
      {/* Hero Section */}
      <section className="w-full rounded-[32px] bg-gradient-to-br from-slate-900 via-emerald-900 to-lime-700 py-16 text-white shadow-[0_24px_80px_rgba(84,140,98,0.24)]">
        <div className="mx-auto max-w-[100rem] px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="font-heading text-6xl text-white mb-6">
              Dr. Upadhyaya's Homeopathy
            </h1>
            <p className="font-paragraph text-xl leading-relaxed text-emerald-50/85">
              Providing compassionate homeopathic care with a focus on holistic healing 
              and personalized treatment plans across our Noida and Delhi locations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="w-full max-w-[100rem] mx-auto px-2 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-heading text-4xl text-foreground mb-4">Our Doctors</h2>
          <p className="font-paragraph text-lg text-foreground/80">
            Experienced homeopathic practitioners dedicated to your health
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dr. R.C. Upadhyaya */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-sm transition-all duration-300 overflow-hidden group"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-accent-gold/30 group-hover:border-accent-gold/60 transition-all duration-300">
                <Image
                  src="https://static.wixstatic.com/media/3fbaca_e2b4cf1af34e4fb992258cbdf513ae85~mv2.jpeg"
                  alt="Dr. R.C. Upadhyaya"
                  width={160}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-heading text-2xl text-foreground mb-2">Dr. R.C. Upadhyaya</h3>
                <p className="font-paragraph text-sm text-accent-gold font-medium mb-2">D.H.M.S. (JAIPUR)</p>
                <p className="font-paragraph text-sm text-foreground/80 mb-4">Founder & Chief Homeopathic Consultant</p>
                <Badge variant="outline" className="font-paragraph">Homeopathic Medicine</Badge>
              </div>
            </div>
          </motion.div>

          {/* Dr. Priya Upadhyaya */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-sm transition-all duration-300 overflow-hidden group"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-accent-gold/30 group-hover:border-accent-gold/60 transition-all duration-300">
                <Image
                  src="https://static.wixstatic.com/media/3fbaca_55af41eb68914b3a85b967748f59444a~mv2.jpeg"
                  alt="Dr. Priya Upadhyaya"
                  width={160}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-heading text-2xl text-foreground mb-2">Dr. Priya Upadhyaya</h3>
                <p className="font-paragraph text-sm text-accent-gold font-medium mb-1">B.H.M.S. (DELHI)</p>
                <p className="font-paragraph text-sm text-accent-gold font-medium mb-2">M.D.(HOM.) (JAIPUR)</p>
                <p className="font-paragraph text-sm text-foreground/80 mb-4">Senior Homeopathic Consultant</p>
                <Badge variant="outline" className="font-paragraph">Homeopathic Medicine</Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Treatments Section */}
      <section className="w-full rounded-[32px] bg-white py-16 shadow-sm">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="font-heading text-4xl text-foreground mb-4">Treatments Offered</h2>
            <p className="font-paragraph text-lg text-foreground/80">
              Comprehensive homeopathic care for a wide range of conditions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treatmentsList.map((treatment, index) => (
              <motion.div
                key={treatment}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 p-6 transition-all duration-300 cursor-pointer"
              >
                <div className="relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-gold mt-2 flex-shrink-0" />
                    <p className="font-paragraph text-base text-foreground font-medium">{treatment}</p>
                  </div>
                  {/* Hidden info on hover */}
                  <div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-300">
                    <p className="text-foreground/80 text-sm mt-3 pt-3 border-t border-emerald-100">
                      Expert homeopathic treatment for {treatment.toLowerCase()} using personalized remedies and proven therapeutic protocols.
                    </p>
                  </div>
                </div>
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-emerald-100/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic Locations */}
      <section className="w-full max-w-[100rem] mx-auto px-2 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-heading text-4xl text-foreground mb-4">Our Locations</h2>
          <p className="font-paragraph text-lg text-foreground/80">
            Visit us at either of our convenient clinic locations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Noida Clinic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-sm"
          >
            <h3 className="font-heading text-2xl text-foreground mb-6">Clinic 1 - Noida</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/80 mb-1">Address</p>
                  <p className="font-paragraph text-base text-foreground">
                    102, Jaipuria Plaza, Sec-26, Noida
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/80 mb-1">Phone</p>
                  <p className="font-paragraph text-base text-foreground">0120-4295211</p>
                  <p className="font-paragraph text-base text-foreground">8010877211</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/80 mb-1">Hours</p>
                  <p className="font-paragraph text-base text-foreground">Mon-Sat: 10:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delhi Clinic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-sm"
          >
            <h3 className="font-heading text-2xl text-foreground mb-6">Clinic 2 - Delhi</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/80 mb-1">Address</p>
                  <p className="font-paragraph text-base text-foreground">
                    G-16, Vardhman Sun-Rise Plaza, Vasundhara Enclave, Delhi-96
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/80 mb-1">Phone</p>
                  <p className="font-paragraph text-base text-foreground">011-47520627</p>
                  <p className="font-paragraph text-base text-foreground">9205664653</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/80 mb-1">Hours</p>
                  <p className="font-paragraph text-base text-foreground">Mon-Sat: 10:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="w-full rounded-[32px] bg-white py-16 shadow-sm">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="font-heading text-4xl text-foreground mb-8">Why Choose Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="inline-block p-4 bg-accent-gold/20 rounded-full">
                  <Award className="w-8 h-8 text-accent-gold" />
                </div>
                <h3 className="font-heading text-xl text-foreground">Experienced Doctors</h3>
                <p className="font-paragraph text-sm text-foreground/80">
                  Qualified homeopathic practitioners with years of experience
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-block p-4 bg-accent-gold/20 rounded-full">
                  <MapPin className="w-8 h-8 text-accent-gold" />
                </div>
                <h3 className="font-heading text-xl text-foreground">Convenient Locations</h3>
                <p className="font-paragraph text-sm text-foreground/80">
                  Two clinics in Noida and Delhi for easy access
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-block p-4 bg-accent-gold/20 rounded-full">
                  <Clock className="w-8 h-8 text-accent-gold" />
                </div>
                <h3 className="font-heading text-xl text-foreground">Flexible Hours</h3>
                <p className="font-paragraph text-sm text-foreground/80">
                  Open six days a week to accommodate your schedule
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </DashboardShell>
  );
}
