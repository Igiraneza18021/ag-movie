import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = generatePageMetadata(
  "Terms of Service",
  "Read the terms and conditions for using Agasobanuye Movies. Understand your rights and responsibilities when using our streaming platform.",
  "/terms"
)

export default function TermsOfServicePage() {
  const lastUpdated = "December 19, 2024"

  const sections = [
    {
      title: "Acceptance of Terms",
      content: [
        "By accessing and using Agasobanuye Movies, you accept and agree to be bound by the terms and provision of this agreement.",
        "If you do not agree to abide by the above, please do not use this service.",
        "These terms apply to all visitors, users, and others who access or use the service."
      ]
    },
    {
      title: "Use License",
      content: [
        "Permission is granted to temporarily access Agasobanuye Movies for personal, non-commercial transitory viewing only.",
        "This is the grant of a license, not a transfer of title, and under this license you may not:",
        "• Modify or copy the materials",
        "• Use the materials for any commercial purpose or for any public display",
        "• Attempt to reverse engineer any software contained on the website",
        "• Remove any copyright or other proprietary notations from the materials"
      ]
    },
    {
      title: "User Accounts",
      content: [
        "When you create an account with us, you must provide information that is accurate, complete, and current at all times.",
        "You are responsible for safeguarding the password and for all activities that occur under your account.",
        "You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.",
        "We reserve the right to suspend or terminate accounts that violate these terms."
      ]
    },
    {
      title: "Prohibited Uses",
      content: [
        "You may not use our service:",
        "• For any unlawful purpose or to solicit others to perform unlawful acts",
        "• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances",
        "• To infringe upon or violate our intellectual property rights or the intellectual property rights of others",
        "• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate",
        "• To submit false or misleading information",
        "• To upload or transmit viruses or any other type of malicious code"
      ]
    },
    {
      title: "Content and Intellectual Property",
      content: [
        "The content on Agasobanuye Movies, including but not limited to text, graphics, logos, images, and software, is the property of Agasobanuye Movies or its content suppliers.",
        "All content is protected by copyright, trademark, and other intellectual property laws.",
        "You may not reproduce, distribute, modify, or create derivative works from any content without explicit permission.",
        "Third-party content is used under appropriate licenses and agreements."
      ]
    },
    {
      title: "Disclaimer",
      content: [
        "The information on Agasobanuye Movies is provided on an 'as is' basis.",
        "To the fullest extent permitted by law, Agasobanuye Movies excludes all representations, warranties, conditions and terms.",
        "Agasobanuye Movies does not warrant that the website will be constantly available or available at all.",
        "Nothing in this disclaimer will limit or exclude our liability for death or personal injury."
      ]
    },
    {
      title: "Limitations",
      content: [
        "In no event shall Agasobanuye Movies or its suppliers be liable for any damages arising out of the use or inability to use the materials on Agasobanuye Movies.",
        "This includes, without limitation, damages for loss of data or profit, or due to business interruption.",
        "Because some jurisdictions do not allow limitations on implied warranties, these limitations may not apply to you."
      ]
    },
    {
      title: "Accuracy of Materials",
      content: [
        "The materials appearing on Agasobanuye Movies could include technical, typographical, or photographic errors.",
        "Agasobanuye Movies does not warrant that any of the materials on its website are accurate, complete, or current.",
        "Agasobanuye Movies may make changes to the materials contained on its website at any time without notice.",
        "However, Agasobanuye Movies does not make any commitment to update the materials."
      ]
    },
    {
      title: "Links",
      content: [
        "Agasobanuye Movies has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site.",
        "The inclusion of any link does not imply endorsement by Agasobanuye Movies of the site.",
        "Use of any such linked website is at the user's own risk."
      ]
    },
    {
      title: "Modifications",
      content: [
        "Agasobanuye Movies may revise these terms of service for its website at any time without notice.",
        "By using this website, you are agreeing to be bound by the then current version of these terms of service.",
        "We will notify users of any material changes to these terms."
      ]
    },
    {
      title: "Governing Law",
      content: [
        "These terms and conditions are governed by and construed in accordance with applicable laws.",
        "Any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts.",
        "If any provision of these terms is found to be unenforceable, the remaining provisions will remain in full force and effect."
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
              Terms of Service
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Please read these terms carefully before using Agasobanuye Movies. By using our service, you agree to these terms.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Agasobanuye Movies. These Terms of Service ("Terms") govern your use of our streaming platform 
                  and services. By accessing or using Agasobanuye Movies, you agree to be bound by these Terms.
                </p>
                <br />
                <p className="text-muted-foreground leading-relaxed">
                  If you disagree with any part of these terms, then you may not access the service. 
                  These Terms apply to all visitors, users, and others who access or use the service.
                </p>
              </CardContent>
            </Card>

            {/* Terms Sections */}
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
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  If you have any questions about these Terms of Service, please contact us.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> legal@ag.micorp.pro</p>
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

