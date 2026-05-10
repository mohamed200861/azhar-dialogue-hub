/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Conferma la tua email per {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Conferma la tua email</Heading>
        <Text style={text}>
          Grazie per esserti registrato su{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          Conferma il tuo indirizzo email ({recipient}) cliccando il pulsante qui sotto:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Conferma email
        </Button>
        <Text style={footer}>
          Se non hai creato un account, puoi ignorare questa email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(120, 50%, 22%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#555555',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const link = { color: 'hsl(115, 45%, 33%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(115, 45%, 33%)',
  color: '#ffffff',
  fontSize: '15px',
  borderRadius: '14px',
  padding: '12px 22px',
  textDecoration: 'none',
  fontWeight: 'bold' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
