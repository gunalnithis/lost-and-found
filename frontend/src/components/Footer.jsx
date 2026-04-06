const Footer = () => {
  return (
    <footer className="mt-16 border-t border-deep-border bg-deep-ink text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <h3 className="mb-2 font-semibold text-slate-100">Quick Links</h3>
          <p>Home</p>
          <p>Lost Items</p>
          <p>Found Items</p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-slate-100">Contact</h3>
          <p>campuslostfound@gmail.com</p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-slate-100">Campus Lost & Found</h3>
          <p>Helping students reconnect with their belongings.</p>
        </div>
      </div>

      <p className="bg-deep-bg/80 py-4 text-center text-sm text-deep-muted">
        © 2026 Campus Lost & Found. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
