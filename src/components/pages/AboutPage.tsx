import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Award } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Doctors, Treatments, ClinicLocations } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Badge } from '@/components/ui/badge';

export default function AboutPage() {
  const [doctors, setDoctors] = useState<Doctors[]>([]);
  const [treatments, setTreatments] = useState<Treatments[]>([]);
  const [locations, setLocations] = useState<ClinicLocations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [doctorsResult, treatmentsResult, locationsResult] = await Promise.all([
        BaseCrudService.getAll<Doctors>('doctors'),
        BaseCrudService.getAll<Treatments>('treatments'),
        BaseCrudService.getAll<ClinicLocations>('cliniclocations')
      ]);
      setDoctors(doctorsResult.items);
      setTreatments(treatmentsResult.items);
      setLocations(locationsResult.items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="w-full bg-white py-20">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="font-heading text-6xl text-foreground mb-6">
              Dr. Upadhyaya's Homeopathy
            </h1>
            <p className="font-paragraph text-xl text-foreground/70 leading-relaxed">
              Providing compassionate homeopathic care with a focus on holistic healing 
              and personalized treatment plans across our Noida and Delhi locations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="w-full max-w-[100rem] mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-heading text-4xl text-foreground mb-4">Our Doctors</h2>
          <p className="font-paragraph text-lg text-foreground/70">
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
            className="bg-white p-8 rounded-lg border border-secondary/30"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-heading text-4xl text-primary">RU</span>
              </div>
              <div>
                <h3 className="font-heading text-2xl text-foreground mb-2">Dr. R.C. Upadhyaya</h3>
                <p className="font-paragraph text-sm text-foreground/60 mb-4">D.H.M.S. (JAIPUR)</p>
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
            className="bg-white p-8 rounded-lg border border-secondary/30"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-heading text-4xl text-primary">PU</span>
              </div>
              <div>
                <h3 className="font-heading text-2xl text-foreground mb-2">Dr. Priya Upadhyaya</h3>
                <p className="font-paragraph text-sm text-foreground/60 mb-2">B.H.M.S. (DELHI)</p>
                <p className="font-paragraph text-sm text-foreground/60 mb-4">M.D.(HOM.) (JAIPUR)</p>
                <Badge variant="outline" className="font-paragraph">Homeopathic Medicine</Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Treatments Section */}
      <section className="w-full bg-white py-20">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="font-heading text-4xl text-foreground mb-4">Treatments Offered</h2>
            <p className="font-paragraph text-lg text-foreground/70">
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
                className="bg-background p-6 rounded-lg border border-secondary/30"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="font-paragraph text-base text-foreground">{treatment}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic Locations */}
      <section className="w-full max-w-[100rem] mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-heading text-4xl text-foreground mb-4">Our Locations</h2>
          <p className="font-paragraph text-lg text-foreground/70">
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
            className="bg-white p-8 rounded-lg border border-secondary/30"
          >
            <h3 className="font-heading text-2xl text-foreground mb-6">Clinic 1 - Noida</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Address</p>
                  <p className="font-paragraph text-base text-foreground">
                    102, Jaipuria Plaza, Sec-26, Noida
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Phone</p>
                  <p className="font-paragraph text-base text-foreground">0120-4295211</p>
                  <p className="font-paragraph text-base text-foreground">8010877211</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Hours</p>
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
            className="bg-white p-8 rounded-lg border border-secondary/30"
          >
            <h3 className="font-heading text-2xl text-foreground mb-6">Clinic 2 - Delhi</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Address</p>
                  <p className="font-paragraph text-base text-foreground">
                    G-16, Vardhman Sun-Rise Plaza, Vasundhara Enclave, Delhi-96
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Phone</p>
                  <p className="font-paragraph text-base text-foreground">011-47520627</p>
                  <p className="font-paragraph text-base text-foreground">9205664653</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Hours</p>
                  <p className="font-paragraph text-base text-foreground">Mon-Sat: 10:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="w-full bg-white py-20">
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
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl text-foreground">Experienced Doctors</h3>
                <p className="font-paragraph text-sm text-foreground/70">
                  Qualified homeopathic practitioners with years of experience
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl text-foreground">Convenient Locations</h3>
                <p className="font-paragraph text-sm text-foreground/70">
                  Two clinics in Noida and Delhi for easy access
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl text-foreground">Flexible Hours</h3>
                <p className="font-paragraph text-sm text-foreground/70">
                  Open six days a week to accommodate your schedule
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
