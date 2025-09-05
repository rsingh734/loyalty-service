import express, { Request, Response, Express } from "express";

/**
 * Interface representing a customer.
 */
interface Customer {
    id: number;
    name: string;
    status: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE";
    points: number;
    lastPurchaseDate: string;
    email?: string;
    preferredStore?: string;
    joinDate: string;
    notifications: boolean;
    lastStatusChange?: string;
}

const customers: Customer[] = [
    {
        id: 1,
        name: "John Smith",
        status: "SILVER",
        points: 450,
        lastPurchaseDate: "2024-02-15",
        joinDate: "2023-06-15",
        notifications: true,
        preferredStore: "Downtown",
    },
    {
        id: 2,
        name: "Jane Doe",
        status: "GOLD",
        points: 850,
        lastPurchaseDate: "2024-03-01",
        email: "jane.doe@email.com",
        joinDate: "2023-01-20",
        notifications: false,
         lastStatusChange: "2024-08-15T00:00:00.000Z" 
    },
];

const app: Express = express();
app.use(express.json());

/**
 * Retrieve a customer by ID.
 * @route GET /api/customers/:id
 * @param req - Express request object
 * @param res - Express response object
 */
app.get("/api/customers/:id", (req: Request, res: Response): void => {
    const customerId: number = parseInt(req.params.id);
    const customer: Customer | undefined = customers.find(
        (c) => c.id === customerId
    );
    if (customer) {
        res.json(customer);
    } else {
        res.status(404).send("Customer not found");
    }
});

app.post("/api/customers/:id/adjust-points", (req: Request, res: Response): void => {
    const customerId: number = parseInt(req.params.id);
    const adjustment: number = req.body.adjustment;

    if (typeof adjustment !== "number") {
        res.status(400).send("Adjustment amount must be a number");
        return;
    }

    const customer: Customer | undefined = customers.find(
        (c) => c.id === customerId
    );

    if (!customer) {
        res.status(404).send("Customer not found");
        return;
    }

    // Apply adjustment, clamp to 0
    customer.points = Math.max(0, customer.points + adjustment);

    // Update status
    if (customer.points >= 1000) {
        customer.status = "PLATINUM";
    } else if (customer.points >= 750) {
        customer.status = "GOLD";
    } else if (customer.points >= 500) {
        customer.status = "SILVER";
    } else {
        customer.status = "BRONZE";
    }

    customer.lastStatusChange = new Date().toISOString();

    res.json(customer);
});

app.post("/api/customers/:id/purchase", (req: Request, res: Response): void => {
    const customerId: number = parseInt(req.params.id);
    const customer: Customer | undefined = customers.find(
        (c) => c.id === customerId
    );
    if (!customer) {
        res.status(404).send("Customer not found");
        return;
    }

    const purchaseAmount: number = req.body.amount;
    const storeLocation: string = req.body.storeLocation;
    customer.lastPurchaseDate = new Date().toISOString();

    customer.points += Math.floor(purchaseAmount / 10);
    let multiplier = 1;

    if (customer.status === "GOLD") {
        multiplier *= 1.2;
    } else if (customer.status === "PLATINUM") {
        multiplier *= 2;
    }

    const pointsEarned = Math.floor(customer.points * multiplier);
    customer.points += pointsEarned;
    customer.lastPurchaseDate = new Date().toISOString();
    
 const now = Date.now();
    const gracePeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    const lastChange = customer.lastStatusChange
        ? new Date(customer.lastStatusChange).getTime()
        : 0;

    let newStatus: Customer["status"] = "BRONZE";

    if (customer.points >= 1000) {
        customer.status = "PLATINUM";
    }else if (customer.points >= 750) {
        // Apply GOLD grace period
        if (
            customer.status === "GOLD" &&
            now - lastChange <= gracePeriod
        ) {
            newStatus = "GOLD"; // Still in grace
        } else {
            newStatus = "GOLD"; // Earned
        }
    } else if (customer.points >= 500) {
        newStatus = "SILVER";
    }
    else
        customer.status = "BRONZE";
        customer.lastStatusChange = new Date().toISOString();
    

    res.json(customer);
});

/**
 * Update customer preferences, such as notifications, preferred store, and email.
 * @route PATCH /api/customers/:id/preferences
 * @param req - Express request object
 * @param res - Express response object
 */
app.patch(
    "/api/customers/:id/preferences",
    (req: Request, res: Response): void => {
        const customerId: number = parseInt(req.params.id);
        const customer: Customer | undefined = customers.find(
            (c) => c.id === customerId
        );
        if (!customer) {
            res.status(404).send("Customer not found");
            return;
        }

        if (typeof req.body.notifications === "boolean") {
            customer.notifications = req.body.notifications;
        }
        if (typeof req.body.preferredStore === "string") {
            customer.preferredStore = req.body.preferredStore;
        }
        if (typeof req.body.email === "string") {
            customer.email = req.body.email;
        }

        res.json(customer);
    }
);

export default app;