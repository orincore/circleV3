import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Use AWS SDK v3 with Deno-specific modifications
import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3?no-check'
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner?no-check'

// Comprehensive CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
}

// COMPLETE Deno polyfills for AWS SDK
globalThis.process = {
  env: Deno.env.toObject(),
  cwd: () => Deno.cwd(),
  platform: Deno.build.os,
  version: 'deno',
  versions: { deno: Deno.version.deno },
  hrtime: () => [0, 0],
}

// COMPLETELY disable AWS config file loading
globalThis.ENV_LOADER = 'no-op'
globalThis.CONFIG_LOADER = 'no-op'

// Mock fs module to prevent Node.js filesystem operations
globalThis.fs = {
  readFile: () => Promise.reject(new Error('Filesystem access disabled')),
  readFileSync: () => { throw new Error('Filesystem access disabled') },
  existsSync: () => false,
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    // Parse and validate request
    const { fileName, fileType } = await req.json()
    if (!fileName || !fileType) {
      return new Response(JSON.stringify({ 
        error: 'Missing fileName or fileType'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify all required environment variables exist
    const requiredVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET']
    const missingVars = requiredVars.filter(v => !Deno.env.get(v))
    if (missingVars.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Missing environment variables',
        missingVars
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Configure S3 client with EXPLICIT credentials
    const s3Client = new S3Client({
      region: Deno.env.get('AWS_REGION'),
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
      },
      // Critical configurations for Deno
      disableHostPrefix: true,
      forcePathStyle: true,
      // Disable ALL config file loading
      disableConfigLoader: true,
      // Disable IMDS (EC2 metadata service) checks
      disableFetchDefaults: true,
      // Custom user agent to prevent default loading
      customUserAgent: 'Deno-S3-Uploader/1.0',
    })

    // Generate presigned URL
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const objectKey = `profile-pictures/${Date.now()}-${sanitizedFileName}`

    const command = new PutObjectCommand({
      Bucket: Deno.env.get('AWS_S3_BUCKET'),
      Key: objectKey,
      ContentType: fileType,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return new Response(JSON.stringify({
      url: presignedUrl,
      publicUrl: `https://${Deno.env.get('AWS_S3_BUCKET')}.s3.amazonaws.com/${objectKey}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})