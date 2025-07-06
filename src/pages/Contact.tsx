
import { Card } from "@/components/ui/card";

const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Have questions or feedback about NourishTrack? We'd love to hear from you!
          Reach out to us using the contact information below.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Card className="p-6 shadow-md">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email us at:</p>
                  <p className="text-lg font-semibold text-primary">nourishtrackapp@gmail.com</p>
                </div>
                <div className="text-muted-foreground space-y-2">
                  <p>
                    Send us an email with any questions about our nutrition tracking platform, 
                    feature requests, technical support, or general feedback.
                  </p>
                  <p>
                    Whether you need help with a specific feature, want to suggest an improvement, 
                    or have encountered any issues, we're here to help!
                  </p>
                  <p>
                    Please include as much detail as possible in your message so we can 
                    provide you with the best assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-2">What to Include</h3>
            <ul className="text-muted-foreground space-y-2">
              <li>• Your name and contact information</li>
              <li>• Detailed description of your question or issue</li>
              <li>• Screenshots if reporting a technical problem</li>
              <li>• Any error messages you may have encountered</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">Response Time</h3>
            <p className="text-muted-foreground">We typically respond within 24-48 hours</p>
            <p className="text-muted-foreground">Monday - Friday: Priority support</p>
            <p className="text-muted-foreground">Weekends: We'll get back to you on Monday</p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">Our Team</h3>
            <p className="text-muted-foreground">NourishTrack Support Team</p>
            <p className="text-muted-foreground">Dedicated to helping you achieve</p>
            <p className="text-muted-foreground">your nutrition and wellness goals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
