import type { NextApiRequest, NextApiResponse } from 'next';

const FIREBASE_FUNCTIONS_BASE_URL = process.env.FIREBASE_FUNCTIONS_BASE_URL || 'https://us-central1-college-maintenance-69e16.cloudfunctions.net';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/resetPasswordWithVerification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return res.status(500).json({ error: `Invalid response from server: ${responseText.substring(0, 200)}` });
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying resetPasswordWithVerification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
