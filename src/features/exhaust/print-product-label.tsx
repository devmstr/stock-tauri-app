/* eslint-disable @typescript-eslint/no-unused-vars */
import type React from 'react'
import { useRef, useEffect, useState, forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export interface CompanyData {
  company: string
  address: string
  phone1: string
  phone2: string
  email: string
  logoSrc: string
}

export interface PrintLabelProps {
  companyData: CompanyData
  designation?: string
  qrCode?: string
  barcode?: string
}

export const PrintProductLabel = forwardRef<HTMLDivElement, PrintLabelProps>(
  ({ companyData, designation, qrCode, barcode = '' }, ref) => {
    const barcodeRef = useRef<SVGSVGElement>(null)
    const [_isLoading, setIsLoading] = useState(true)
    const [imageError, setImageError] = useState(false)

    const normalizedLogoPath = companyData.logoSrc.startsWith('/')
      ? companyData.logoSrc
      : `/${companyData.logoSrc}`

    useEffect(() => {
      let isMounted = true

      if (barcodeRef.current && barcode) {
        const loadJsBarcode = async () => {
          try {
            const JsBarcode = (await import('jsbarcode')).default
            if (isMounted && barcodeRef.current) {
              JsBarcode(barcodeRef.current, barcode, {
                format: 'CODE128',
                displayValue: false,
                width: 1.8,
                height: 55,
                margin: 0
              })
            }
          } catch (error) {
            console.error('Failed to load barcode:', error)
          }
        }
        void loadJsBarcode()
      }
      return () => {
        isMounted = false
      }
    }, [barcode])

    return (
      <div
        ref={ref}
        className="flex flex-col bg-white text-black"
        style={{
          width: '100mm',
          height: '60mm',
          padding: '4mm 4mm 4mm 3mm',
          boxSizing: 'border-box',
          fontFamily: 'Roboto, sans-serif'
        }}
      >
        {/* Company Title */}
        <div className="w-full text-center mb-2">
          <h1 className="text-[15pt] font-black uppercase leading-none tracking-tight">
            {companyData.company}
          </h1>
        </div>

        {/* Company Logo & Address & QR */}
        <div className="flex justify-between mb-2 items-start h-[20mm]">
          <div className="w-[13mm] h-[13mm] pb-0.5 flex items-center justify-center">
            {!imageError ? (
              <img
                src={normalizedLogoPath || '/oki-logo.svg'}
                alt="Logo"
                className="max-h-full max-w-full object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                LOGO
              </div>
            )}
          </div>

          <div className="flex-1 px-2  leading-tight font-sans">
            <p className="font-bold text-[7.65pt]">{companyData.address}</p>
            <div className="flex text-[7.3pt] gap-2 mt-1">
              <p>Tel: {companyData.phone1}</p>
              <p>Tel: {companyData.phone2}</p>
            </div>
            <p className="mt-1 text-[7.3pt]">Email: {companyData.email}</p>
          </div>

          <div className="flex flex-col items-center w-[12mm] h-[12mm] mt-0.5">
            <QRCodeSVG
              value={qrCode?.substring(0, 12) || ''}
              size={65}
              marginSize={0}
            />
          </div>
        </div>

        {/* Product Information */}
        <div className="flex-1 pl-1 flex flex-col justify-center pb-5">
          <p
            className="text-[12pt]  font-black uppercase leading-[1.1]  "
            style={{ lineHeight: '1.2rem' }}
          >
            {designation}
          </p>
        </div>

        {/* Bottom Section: Fabriqué & Barcode */}
        <div className="pl-1 flex gap-3 items-end justify-between">
          <div className="text-[7pt] font-bold pb-5.5">
            <p>Fabriqué en ALGERIE</p>
            <p className="font-semibold text-[6pt]">
              {new Date().toLocaleDateString('fr-FR', {
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="flex flex-col items-end ">
            <svg
              ref={barcodeRef}
              style={{ height: '9mm', width: '35mm' }}
            ></svg>
            <p className="text-[8pt] font-mono tracking-widest mt-0.5 text-center w-full">
              {barcode}
            </p>
          </div>
        </div>
      </div>
    )
  }
)

PrintProductLabel.displayName = 'PrintProductLabel'
