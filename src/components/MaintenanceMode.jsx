import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Clock3, Mail, Phone, ShieldAlert, Wrench } from 'lucide-react';
import appConfig from '../config/appConfig';

export function MaintenanceMode({
  message = appConfig.maintenance.message,
  estimatedTime = appConfig.maintenance.estimatedTime,
  contactEmail = appConfig.maintenance.contactEmail,
  contactPhone = appConfig.maintenance.contactPhone,
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#050506] px-4 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_38%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.1),transparent_30%)]" />
      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl rounded-3xl border border-border/70 bg-surface/85 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8"
      >
        <div className="flex items-center gap-3 border-b border-border/60 pb-5">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-textMuted">Service Status</p>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Maintenance Mode</h1>
          </div>
        </div>

        <div className="grid gap-6 pt-6 sm:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/60 bg-black/20 p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-textMuted">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Temporary Outage
              </div>
              <p className="text-base leading-relaxed text-textMain sm:text-lg">{message}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-textMuted">
                  <Clock3 className="h-4 w-4 text-primary" />
                  Estimated Time
                </div>
                <p className="mt-2 text-xl font-black text-white">{estimatedTime}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-textMuted">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{contactPhone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              <Mail className="h-4 w-4" />
              Support
            </div>
            <p className="mt-3 text-sm leading-relaxed text-textMain">
              Please contact the support team if you need immediate assistance or an ETA update.
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-primary/30 bg-primary/20 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary/30"
            >
              {contactEmail}
            </a>
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border/70 bg-black/20 px-4 py-3 text-sm font-bold text-textMain transition-colors hover:border-primary/40 hover:text-white"
              >
                {contactPhone}
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

MaintenanceMode.propTypes = {
  message: PropTypes.string,
  estimatedTime: PropTypes.string,
  contactEmail: PropTypes.string,
  contactPhone: PropTypes.string,
};
