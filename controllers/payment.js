const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Stripe = require("stripe");
const Appointment = require("../models/Appointment");
const moment = require("moment-timezone");
const stripe = Stripe(process.env.STRIPE_KEY);

// @desc    Create checkout session
// @route   POST /api/v1/payment
// @access  Public
exports.createPayment = asyncHandler(async (req, res, next) => {
  const newCartItems = req.body.cartItems.map((item) => ({
    name: item.name,
    image: item.image,
    price: item.price,
    desc: item.desc,
  }));

  const customer = await stripe.customers.create({
    metadata: {
      userId: req.user ? req.user.id : "",
      cart: JSON.stringify(newCartItems),
    },
  });

  const line_items = await Promise.all(
    req.body.cartItems.map(async (item) => {
      const date = new Date(item.date);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const hour = item.selectTime.hour;
      const endhour = item.selectTime.endhour;
      const endminute = item.selectTime.endminute;
      const minute = item.selectTime.minute;
      const timezone = item.selectTime.zone;

      const localDate = moment.tz({ year, month, day, hour, minute }, timezone);
      const utcDate = localDate.utc();

      const endlocalDate = moment.tz(
        { year, month, day, endhour, endminute },
        timezone
      );
      const endTime = endlocalDate.utc();
      const meeting = {
        user: req.user.id,
        store: item.business._id,
        name: item.name,
        purpose: item.desc,
        image: item.image,
        time: utcDate,
        endTime,
        duration: item.selectTime.duration,
        price: item.price,
        homeService: item.homeService,
      };

      const appointment = await Appointment.create(meeting);
      return {
        price_data: {
          currency: item.business.currency === "pounds" ? "gbp" : "eur",
          product_data: {
            name: item.name,
            images: [item.image],
            description: item.desc,
            metadata: {
              id: appointment._id,
            },
          },
          unit_amount: item.price * 100,
        },
        quantity: item.cartQuantity,
      };
    })
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "paypal"],
    phone_number_collection: {
      enabled: true,
    },
    line_items,
    mode: "payment",
    customer: customer.id,
    success_url: `https://glamor-gram-client.onrender.com/`,
    cancel_url: `https://glamor-gram-client.onrender.com/${req.body.cartItems[0].business._id}`,
  });

  res.status(201).json({
    success: true,
    data: session.url,
  });
});

// @desc    Verify subscription
// @route   POST /api/v1/payments/webhook
// @access  Private
exports.webhook = asyncHandler(async (req, res, next) => {
  //validate event
  let data;
  let eventType;

  // Check if webhook signing is configured.
  let webhookSecret;
  webhookSecret = process.env.STRIPE_WEB_HOOK;

  if (webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed:  ${err}`);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data.object;
    console.log("data", data);
    eventType = event.type;
    console.log("event", event);
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data.object;
    console.log("data", data);
    eventType = req.body.type;
    console.log("event", event);
  }

  // Handle the checkout.session.completed event
  if (eventType === "checkout.session.completed") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        try {
          // CREATE ORDER
          // createOrder(customer, data);
          console.log(customer, data);
        } catch (err) {
          console.log(typeof createOrder);
          console.log(err);
        }
      })
      .catch((err) => console.log(err.message));
  }

  res.status(200).end();
});
