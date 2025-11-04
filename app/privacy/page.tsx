import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { generatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = generatePageMetadata(
  "Privacy Policy",
  "Learn how Agasobanuye Movies protects your privacy and handles your personal information. Our commitment to data security and user privacy.",
  "/privacy"
)

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 19, 2024"

  const sections = [
    {
      title: "Information We Collect",
      content: [
        "We collect information you provide directly to us, such as when you create an account, contact us, or use our services.",
        "This may include your name, email address, viewing preferences, and any other information you choose to provide.",
        "We automatically collect certain information about your device and usage patterns when you access our platform."
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        "To provide, maintain, and improve our streaming services",
        "To personalize your viewing experience and recommend content",
        "To communicate with you about our services and respond to your inquiries",
        "To analyze usage patterns and improve our platform's performance",
        "To ensure the security and integrity of our services"
      ]
    },
    {
      title: "Information Sharing",
      content: [
        "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.",
        "We may share information with trusted service providers who assist us in operating our platform, conducting our business, or serving our users.",
        "We may disclose information when required by law or to protect our rights, property, or safety."
      ]
    },
    {
      title: "Data Security",
      content: [
        "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
        "We use industry-standard encryption and security protocols to safeguard your data.",
        "However, no method of transmission over the internet or electronic storage is 100% secure."
      ]
    },
    {
      title: "Cookies and Tracking",
      content: [
        "We use cookies and similar tracking technologies to enhance your experience on our platform.",
        "Cookies help us remember your preferences and provide personalized content.",
        "You can control cookie settings through your browser preferences."
      ]
    },
    {
      title: "Your Rights",
      content: [
        "You have the right to access, update, or delete your personal information",
        "You can opt out of certain data collection and processing activities",
        "You have the right to data portability and to restrict processing",
        "You can contact us at any time to exercise these rights"
      ]
    },
    {
      title: "Children's Privacy",
      content: [
        "Our services are not directed to children under 13 years of age.",
        "We do not knowingly collect personal information from children under 13.",
        "If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information."
      ]
    },
    {
      title: "Changes to This Policy",
      content: [
        "We may update this Privacy Policy from time to time.",
        "We will notify you of any material changes by posting the new Privacy Policy on this page.",
        "Your continued use of our services after any modifications constitutes acceptance of the updated policy."
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  At Agasobanuye Movies, we are committed to protecting your privacy and ensuring the security of your personal information. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                  streaming platform and related services.
                </p>
                <br />
                <p className="text-muted-foreground leading-relaxed">
                  By using our services, you agree to the collection and use of information in accordance with this policy. 
                  If you do not agree with our policies and practices, please do not use our services.
                </p>
              </CardContent>
            </Card>

            {/* Policy Sections */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-muted-foreground leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Information */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
                <CardDescription>
                  If you have any questions about this Privacy Policy, please contact us.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> privacy@ag.micorp.pro</p>
                  <p><strong>General Support:</strong> support@ag.micorp.pro</p>
                  <p><strong>Website:</strong> <a href="/contact" className="text-primary hover:underline">Contact Us Page</a></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

