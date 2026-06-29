export default function Testimonials() {
  return (
    <section className="testimonials-section">
      <h2 className="section-title">Subscription</h2>

      <div className="testimonials-grid">
        <div className="testimonial-card animate-box">
            <h4>Monthly</h4>
          <p>
            “Track your expense for a Month.”
          </p>
        
        </div>
        
        <div className="testimonial-card animate-box">
          <h4>Yearly</h4>
          <p>
             “Track your expense for a Year.”
          </p>
          
        </div>

        <div className="testimonial-card animate-box">
           <h4>2 Years</h4>
          <p>
           “Get 20% OFF on 2 Year subscription.”
          </p>
         
        </div>
      </div>
    </section>
  );
}
