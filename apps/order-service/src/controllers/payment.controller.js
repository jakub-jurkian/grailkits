const { errorResponse } = require('../utils/errors');

class PaymentController {
  constructor(paymentService) {
    this.paymentService = paymentService;
    this.create = this.create.bind(this);
    this.authorize = this.authorize.bind(this);
    this.markFailed = this.markFailed.bind(this);
    this.getById = this.getById.bind(this);
    this.countByStatus = this.countByStatus.bind(this);
  }

  // POST /api/v1/orders/:id/payment
  async create(req, res) {
    try {
      const orderId = req.params.id;
      const body = req.body || {};
      const payment = await this.paymentService.create({
        orderId,
        amount: body.amount,
        method: body.method,
      });
      res.status(201).json(payment);
    } catch (error) {
      console.error('[PaymentController] create error:', error);
      errorResponse(res, error);
    }
  }

  // POST /api/v1/payments/:id/authorize
  async authorize(req, res) {
    try {
      const payload = (req.body && req.body.payload) || {};
      const payment = await this.paymentService.authorize(req.params.id, payload);
      res.status(200).json(payment);
    } catch (error) {
      console.error('[PaymentController] authorize error:', error);
      errorResponse(res, error);
    }
  }

  // POST /api/v1/payments/:id/fail
  async markFailed(req, res) {
    try {
      const reason = req.body && req.body.reason;
      const payment = await this.paymentService.markFailed(req.params.id, reason);
      res.status(200).json(payment);
    } catch (error) {
      console.error('[PaymentController] markFailed error:', error);
      errorResponse(res, error);
    }
  }

  // GET /api/v1/payments/:id
  async getById(req, res) {
    try {
      const payment = await this.paymentService.getById(req.params.id);
      res.status(200).json(payment);
    } catch (error) {
      console.error('[PaymentController] getById error:', error);
      errorResponse(res, error);
    }
  }

  // GET /api/v1/payments/count?status=...
  async countByStatus(req, res) {
    try {
      const status = req.query.status;
      const total = await this.paymentService.countByStatus(status);
      res.status(200).json({ status, total });
    } catch (error) {
      console.error('[PaymentController] countByStatus error:', error);
      errorResponse(res, error);
    }
  }
}

module.exports = PaymentController;
