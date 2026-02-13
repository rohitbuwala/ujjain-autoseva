export default function PrivacyPolicy() {
    const lastUpdated = "February 13, 2026";

    const sections = [
        {
            title: "1. Information We Collect",
            content: "We collect information you provide directly to us, such as when you create an account, book a ride, or contact customer support. This information may include your name, email address, phone number, and pickup/drop-off locations. We also collect usage data and location information to provide our services effectively.",
        },
        {
            title: "2. How We Use Your Information",
            content: "Ujjain AutoSeva uses the collected information to process your bookings, communicate with you about your rides, improve our services, and ensure safety and security. We may also use your information for marketing purposes with your consent.",
        },
        {
            title: "3. Information Sharing",
            content: "We do not sell your personal information to third parties. We may share your information with our drivers to facilitate your ride, or with service providers who help us operate our business. We may also disclose information if required by law.",
        },
        {
            title: "4. Data Security",
            content: "We implement industry-standard security measures to protect your personal information from unauthorized access, loss, or misuse. However, no method of transmission over the internet is 100% secure.",
        },
        {
            title: "5. Your Rights",
            content: "You have the right to access, update, or delete your personal information. You can manage your account settings or contact us for assistance with these requests.",
        },
        {
            title: "6. Changes to This Policy",
            content: "We may update this privacy policy from time to time. Any changes will be posted on this page with an updated 'Last Updated' date.",
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <section className="py-20 bg-muted/30">
                <div className="container-custom max-w-4xl">
                    <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last Updated: {lastUpdated}</p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-custom max-w-4xl">
                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            At Ujjain AutoSeva, we take your privacy seriously. This Privacy Policy explains
                            how we collect, use, and protect your personal information when you use our
                            website and services.
                        </p>

                        {sections.map((section, idx) => (
                            <div key={idx}>
                                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    {section.content}
                                </p>
                            </div>
                        ))}

                        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 mt-12">
                            <h2 className="text-xl font-bold mb-2 text-primary">Contact Us</h2>
                            <p className="text-muted-foreground">
                                If you have any questions about this Privacy Policy, please contact us at
                                <span className="font-semibold text-foreground ml-1">privacy@ujjainautoseva.com</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
