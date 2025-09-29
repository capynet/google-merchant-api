import {Router, NextFunction} from 'express';
import {googleShoppingService} from '../services/googleShopping';
import {oauth2Client, hasContentScope} from '../config/oauth';

const router: Router = Router();

async function requireContentScope(req: any, res: any, next: NextFunction): Promise<void> {
    if (!req.session?.tokens) {
        res.status(401).json({error: 'Authentication required'});
        return;
    }

    const hasScope = await hasContentScope(req.session.tokens);
    if (!hasScope) {
        res.status(403).json({error: 'Content scope required. Please authorize merchant access.'});
        return;
    }

    oauth2Client.setCredentials(req.session.tokens);
    next();
}

router.get('/api/accounts', requireContentScope, async (req: any, res: any) => {
    try {
        const accounts = await googleShoppingService.listMerchantAccounts();

        res.json({
            accounts: accounts || [],
        });
    } catch (error) {
        console.error('Error fetching merchant accounts:', error);
        res.status(500).json({
            error: 'Failed to fetch merchant accounts',
            details: (error as Error).message
        });
    }
});

export default router;