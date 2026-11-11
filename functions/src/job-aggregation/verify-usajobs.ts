import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

const USAJOBS_API_KEY = defineSecret('USAJOBS_API_KEY');

const USAJOBS_USER_AGENT = defineSecret('USAJOBS_USER_AGENT');

// Allowed frontend origins.
const ALLOWED_ORIGINS = [
  'http://localhost:4200',
  'http://localhost:5000',
  'https://zebron-2b49f.web.app',
  'https://zebron-2b49f.firebaseapp.com',
];

export const verifyUsajobsCredentials = onRequest(
  {
    region: 'us-central1',

    cors: ALLOWED_ORIGINS,

    secrets: [
      USAJOBS_API_KEY,
      USAJOBS_USER_AGENT,
    ],
  },

  async (req, res) => {
    // Identify the requesting frontend.
    const origin = req.headers.origin;

    // Set CORS headers for approved origins.
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader(
        'Access-Control-Allow-Origin',
        origin,
      );

      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, OPTIONS',
      );

      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );

      res.setHeader('Vary', 'Origin');
    }

    // Handle browser preflight requests.
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only GET requests are supported.
    if (req.method !== 'GET') {
      res.status(405).json({
        success: false,
        message: 'Method not allowed.',
      });
      return;
    }


    try {
      const apiKey = USAJOBS_API_KEY.value();
      const userAgent = USAJOBS_USER_AGENT.value();

      if (!apiKey || !userAgent) {
        logger.error('USAJOBS secrets are missing.');

        res.status(500).json({
          success: false,
          message: 'One or both USAJOBS secrets are missing.',
        });

        return;
      }

      // Verify credentials against USAJOBS.
      const response = await fetch(
        'https://data.usajobs.gov/api/Search?ResultsPerPage=1',
        {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            'Authorization-Key': apiKey,
            'Accept': 'application/json',
          },
        },
      );

      if (!response.ok) {
        logger.error(
          'USAJOBS credential verification failed.',
          {
            status: response.status,
          },
        );

        res.status(502).json({
          success: false,
          message: 'USAJOBS rejected the API request.',
          httpStatus: response.status,
        });

        return;
      }

      const data = await response.json() as {
        SearchResult?: {
          SearchResultCount?: number;
          SearchResultItems?: unknown[];
        };
      };

      const returnedResults =
        data.SearchResult?.SearchResultItems?.length ?? 0;

      const availableResults =
        data.SearchResult?.SearchResultCount ?? 0;

      logger.info(
        'USAJOBS credentials verified successfully.',
        {
          returnedResults,
          availableResults,
        },
      );

      res.status(200).json({
        success: true,
        message: 'USAJOBS API credentials are working.',
        returnedResults,
        availableResults,
        checkedAt: new Date().toISOString(),
      });

    } catch (error: unknown) {
      logger.error('USAJOBS verification error.', error);

      res.status(500).json({
        success: false,
        message: 'Unable to connect to USAJOBS.',
      });
    }
  },
);