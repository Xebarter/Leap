'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PropertyFormData } from '../types'
import { MapPin, ExternalLink } from 'lucide-react'

interface LocationSectionProps {
  formData: PropertyFormData
  onUpdate: <K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => void
}

export function LocationSection({ formData, onUpdate }: LocationSectionProps) {
  // Extract coordinates or embed URL from Google Maps link
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null
    
    // If it's already an embed URL, return as-is
    if (url.includes('google.com/maps/embed')) {
      return url
    }
    
    // If it's a regular Google Maps share link, just return it
    // The iframe will load it properly
    if (url.includes('google.com/maps') || url.includes('maps.app.goo.gl')) {
      return url
    }
    
    return null
  }

  const embedUrl = getEmbedUrl(formData.google_maps_embed_url || '')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Location</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Help tenants find your property with Google Maps.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Location Display */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">Property Address:</span>
            <span className="text-muted-foreground">
              {formData.location || 'Not set'}
            </span>
          </div>
        </div>

        {/* Google Maps URL */}
        <div className="space-y-2">
          <Label htmlFor="maps" className="text-sm font-medium">
            Google Maps Link
          </Label>
          <Input
            id="maps"
            value={formData.google_maps_embed_url || ''}
            onChange={(e) => onUpdate('google_maps_embed_url', e.target.value)}
            placeholder="https://maps.google.com/maps?q=... or https://maps.app.goo.gl/..."
          />
          <p className="text-xs text-muted-foreground">
            Paste a Google Maps link to display an interactive map on the property details page.
          </p>
          
          {/* How to get the link */}
          <details className="text-xs text-muted-foreground mt-3 p-3 bg-muted/50 rounded-lg">
            <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
              📍 How to get your property's Google Maps link?
            </summary>
            <ol className="mt-3 ml-4 space-y-2 list-decimal text-muted-foreground">
              <li>Open <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">Google Maps</a></li>
              <li>Search for your property address or location</li>
              <li>Once the location appears on the map, click the <strong>Share button</strong> (icon that looks like an arrow pointing up and to the right)</li>
              <li>Click <strong>"Copy link"</strong> to copy the share link</li>
              <li>Paste the link here (it will look like: https://maps.app.goo.gl/xxx or https://maps.google.com/maps?q=...)</li>
            </ol>
          </details>
        </div>

        {/* Map Preview */}
        {formData.google_maps_embed_url && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Map Preview</Label>
            <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mb-2" />
                  <p className="text-sm">Map preview will appear here</p>
                  <a 
                    href={formData.google_maps_embed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                  >
                    Open in Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
