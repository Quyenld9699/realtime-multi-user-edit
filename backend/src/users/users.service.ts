import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./user.schema";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async create(email: string, name: string, password: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new this.userModel({
            email,
            name,
            password: hashedPassword,
        });
        return user.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    async findAll(): Promise<User[]> {
        return this.userModel.find().select("-password").exec();
    }
}
