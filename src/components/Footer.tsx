import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  const noidaClinic = {
    name: 'Clinic 1 - Noida',
    address: '102, Jaipuria Plaza, Sec-26, Noida',
    phones: ['0120-4295211', '8010877211']
  };

  const delhiClinic = {
    name: 'Clinic 2 - Delhi',
    address: 'G-16, Vardhman Sun-Rise Plaza, Vasundhara Enclave, Delhi-96',
    phones: ['011-47520627', '9205664653']
  };

  return (
    <footer className="w-full bg-primary text-white py-16">
      <div className="max-w-[100rem] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Clinic Info */}
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-3xl mb-2">Dr. Upadhyaya's</h3>
              <p className="font-paragraph text-white/90">Homeopathy</p>
            </div>
            <p className="font-paragraph text-sm text-white/80 leading-relaxed">
              Providing compassionate homeopathic care with precision inventory management 
              across our Noida and Delhi locations.
            </p>
          </div>

          {/* Noida Clinic */}
          <div className="space-y-4">
            <h4 className="font-heading text-xl text-white mb-4">{noidaClinic.name}</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1" />
                <p className="font-paragraph text-sm text-white/80 leading-relaxed">
                  {noidaClinic.address}
                </p>
              </div>
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-accent-gold flex-shrink-0" />
                <div className="space-y-1">
                  {noidaClinic.phones.map((phone) => (
                    <p key={phone} className="font-paragraph text-sm text-white/80">
                      {phone}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Delhi Clinic */}
          <div className="space-y-4">
            <h4 className="font-heading text-xl text-white mb-4">{delhiClinic.name}</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-accent-gold flex-shrink-0 mt-1" />
                <p className="font-paragraph text-sm text-white/80 leading-relaxed">
                  {delhiClinic.address}
                </p>
              </div>
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-accent-gold flex-shrink-0" />
                <div className="space-y-1">
                  {delhiClinic.phones.map((phone) => (
                    <p key={phone} className="font-paragraph text-sm text-white/80">
                      {phone}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-paragraph text-sm text-white/60">
              © {new Date().getFullYear()} Dr. Upadhyaya's Homeopathy. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="w-4 h-4" />
              <p className="font-paragraph text-sm">
                Clinic Hours: Mon-Sat, 10:00 AM - 7:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
