import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

type CertificatePdfProps = {
  studentName: string;
  track: string;
  certificateId: string;
  issuedAt?: Date | null;
  verificationUrl: string;
  qrCodeDataUrl: string;
  logoUrl: string;
  signatureOneUrl: string;
  signatureTwoUrl: string;
  sealUrl: string;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f8fafc",
    padding: 10,
    fontFamily: "Helvetica",
  },

  outer: {
    position: "relative",
    border: "7 solid #166534",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 20,
    width: "100%",
    height: "100%",
  },

  innerBorder: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    border: "1.2 solid #d4af37",
    borderRadius: 8,
  },

  watermarkWrap: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    opacity: 0.04,
  },

  watermark: {
    width: 240,
    height: 240,
    objectFit: "contain",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  logo: {
    width: 100,
    height: 52,
    objectFit: "contain",
  },

  topRight: {
    alignItems: "flex-end",
  },

  program: {
    fontSize: 11,
    color: "#166534",
    letterSpacing: 3,
    textTransform: "uppercase",
    fontWeight: 700,
  },

  slogan: {
    marginTop: 2,
    fontSize: 8.5,
    color: "#64748b",
  },

  headingWrap: {
    marginTop: 10,
    alignItems: "center",
  },

  title: {
    fontSize: 36,
    color: "#166534",
    fontStyle: "italic",
    fontWeight: 700,
  },

  subtitle: {
    marginTop: 1,
    fontSize: 10,
    color: "#475569",
    letterSpacing: 4,
    textTransform: "uppercase",
  },

  presentText: {
    marginTop: 10,
    fontSize: 10,
    color: "#64748b",
  },

  studentName: {
    marginTop: 8,
    fontSize: 30,
    color: "#0f172a",
    fontStyle: "italic",
    fontWeight: 700,
    textAlign: "center",
  },

  courseText: {
    marginTop: 10,
    fontSize: 11,
    color: "#334155",
    textAlign: "center",
  },

  trackLine: {
    marginTop: 5,
    fontSize: 16,
    color: "#9a7b12",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 4,
    fontWeight: 700,
  },

  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },

  metaCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    border: "1 solid #e2e8f0",
    borderRadius: 10,
    padding: 10,
  },

  metaLabel: {
    fontSize: 8.5,
    color: "#64748b",
  },

  metaValue: {
    marginTop: 3,
    fontSize: 12,
    color: "#0f172a",
    fontWeight: 700,
  },

  bottomRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  signBlock: {
    width: 170,
    alignItems: "center",
  },

  signature: {
    width: 95,
    height: 32,
    objectFit: "contain",
  },

  line: {
    marginTop: 2,
    width: 130,
    borderTop: "1 solid #64748b",
    paddingTop: 3,
    alignItems: "center",
  },

  signName: {
    fontSize: 9.5,
    color: "#0f172a",
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1.2,
  },

  signRole: {
    marginTop: 2,
    fontSize: 8,
    color: "#475569",
    textAlign: "center",
    lineHeight: 1.2,
  },

  seal: {
    width: 70,
    height: 70,
    objectFit: "contain",
  },

  qrWrap: {
    marginTop: 8,
    alignItems: "center",
  },

  qrBox: {
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    padding: 6,
    backgroundColor: "#ffffff",
  },

  qr: {
    width: 65,
    height: 65,
  },

  qrText: {
    marginTop: 4,
    fontSize: 8,
    color: "#64748b",
  },

  verifyUrl: {
    marginTop: 4,
    fontSize: 6,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export function CertificatePdf({
  studentName,
  track,
  certificateId,
  issuedAt,
  verificationUrl,
  qrCodeDataUrl,
  logoUrl,
  signatureOneUrl,
  signatureTwoUrl,
  sealUrl,
}: CertificatePdfProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outer}>
          <View style={styles.innerBorder} />

          <View style={styles.watermarkWrap}>
            <Image src={logoUrl} style={styles.watermark} />
          </View>

          <View style={styles.topRow}>
            <Image src={logoUrl} style={styles.logo} />
            <View style={styles.topRight}>
              <Text style={styles.program}>Project RISE</Text>
              <Text style={styles.slogan}>
                Renewed Hope for Inclusive Support and Empowerment
              </Text>
            </View>
          </View>

          <View style={styles.headingWrap}>
            <Text style={styles.title}>Certificate</Text>
            <Text style={styles.subtitle}>Of Completion</Text>
            <Text style={styles.presentText}>
              This certificate is presented to
            </Text>
            <Text style={styles.studentName}>{studentName}</Text>
          </View>

          <Text style={styles.courseText}>
            for successfully completing the 4 weeks course in
          </Text>

          <Text style={styles.trackLine}>{track}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Certificate ID</Text>
              <Text style={styles.metaValue}>{certificateId}</Text>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Track</Text>
              <Text style={styles.metaValue}>{track}</Text>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Issued Date</Text>
              <Text style={styles.metaValue}>
                {issuedAt
                  ? new Date(issuedAt).toLocaleDateString()
                  : "Not issued yet"}
              </Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.signBlock}>
              <Image src={signatureOneUrl} style={styles.signature} />
              <View style={styles.line}>
                <Text style={styles.signName}>Dr. Judith Mayen Ogbara</Text>
                <Text style={styles.signRole}>Chairman, G4EP</Text>
              </View>
            </View>

            <Image src={sealUrl} style={styles.seal} />

            <View style={styles.signBlock}>
              <Image src={signatureTwoUrl} style={styles.signature} />
              <View style={styles.line}>
                <Text style={styles.signName}>Dr. Babajide Akinbohun</Text>
                <Text style={styles.signRole}>
                  Executive Director, Projects
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.qrWrap}>
            <View style={styles.qrBox}>
              <Image src={qrCodeDataUrl} style={styles.qr} />
            </View>
            <Text style={styles.qrText}>Scan to verify certificate</Text>
            <Text style={styles.verifyUrl}>{verificationUrl}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}