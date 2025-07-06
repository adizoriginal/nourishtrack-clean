
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NourishTrack. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-4">
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
