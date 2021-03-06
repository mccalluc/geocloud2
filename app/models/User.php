<?php
/**
 * @author     Martin Høgh <mh@mapcentia.com>
 * @copyright  2013-2018 MapCentia ApS
 * @license    http://www.gnu.org/licenses/#AGPL  GNU AFFERO GENERAL PUBLIC LICENSE 3
 *
 */

namespace app\models;

use app\inc\Model;

/**
 * Class User
 * @package app\models
 */
class User extends Model
{
    public $userId;

    function __construct($userId = null)
    {
        parent::__construct();
        $this->userId = $userId;
        $this->postgisdb = "mapcentia";
    }

    /**
     * @return array
     * @throws \Exception
     */
    public function getAll(): array
    {
        $query = "SELECT * FROM users WHERE email<>''";
        $res = $this->execQuery($query);
        $rows = $this->fetchAll($res);
        if (!$this->PDOerror) {
            $response['success'] = true;
            $response['data'] = $rows;
        } else {
            $response['success'] = false;
            $response['message'] = $this->PDOerror;
        }
        return $response;
    }

    /**
     * @return array
     */
    public function getData(): array
    {
        $domain = \app\conf\App::$param['domain'];
        $query = "SELECT screenname as userid, zone, '{$domain}' as host FROM users WHERE screenname = :sUserID";
        $res = $this->prepare($query);
        $res->execute(array(":sUserID" => $this->userId));
        $row = $this->fetchRow($res);
        if (!$row['userid']) {
            $response['success'] = false;
            $response['message'] = "Userid not found";
            //$response['code'] = 406;
            return $response;
        }
        if (!$this->PDOerror) {
            $response['success'] = true;
            $response['data'] = $row;
        } else {
            $response['success'] = false;
            $response['message'] = $this->PDOerror;
        }
        return $response;
    }

    /**
     * @param array $data
     * @return array
     */
    public function createUser(array $data): array
    {
        $user = isset($data["user"]) ? Model::toAscii($data["user"], NULL, "_") : null;

        $password = isset($data["password"]) ? Setting::encryptPw($data["password"]) : null;
        $email = isset($data["email"]) ? $data["email"] : null;
        $userGroup = isset($data["usergroup"]) ? $data["usergroup"] : null;

        $sQuery = "INSERT INTO users (screenname,pw,email,parentdb,usergroup) VALUES(:sUserID, :sPassword, :sEmail, :sParentDb, :sUsergroup) RETURNING screenname,parentdb,email,usergroup";

        try {
            $res = $this->prepare($sQuery);
            $res->execute(array(":sUserID" => $user, ":sPassword" => $password, ":sEmail" => $email, ":sParentDb" => $this->userId, ":sUsergroup" => $userGroup));
            $row = $this->fetchRow($res, "assoc");
        } catch (\Exception $e) {
            $response['success'] = false;
            $response['message'] = $e->getMessage();
            $response['test'] = \app\inc\Session::getUser();
            $response['code'] = 400;
            return $response;
        }

        $response['success'] = true;
        $response['message'] = "User created";
        $response['data'] = $row;
        return $response;
    }

    /**
     * @param array $data
     * @return array
     */
    public function updateUser(array $data): array
    {
        $user = isset($data["user"]) ? Model::toAscii($data["user"], NULL, "_") : null;

        $password = isset($data["password"]) ? Setting::encryptPw($data["password"]) : null;
        $email = isset($data["email"]) ? $data["email"] : null;
        $userGroup = isset($data["usergroup"]) ? $data["usergroup"] : null;

        $sQuery = "UPDATE users SET screenname=screenname";
        if ($password) $sQuery .= ", pw=:sPassword";
        if ($email) $sQuery .= ", email=:sEmail";
        if ($userGroup) {
            $sQuery .= ", usergroup=:sUsergroup";
            $obj[$user] = $userGroup;

            Database::setDb($this->getData()["data"]["userid"]);
            $settings = new \app\models\Setting();
            if (!$settings->updateUserGroups((object)$obj)['success']) {
                $response['success'] = false;
                $response['message'] = "Could not update settings.";
                $response['code'] = 400;
                return $response;
            };
            Database::setDb("mapcentia");

        }
        $sQuery .= " WHERE screenname=:sUserID RETURNING screenname,email,usergroup";

        try {
            $res = $this->prepare($sQuery);
            if ($password) $res->bindParam(":sPassword", $password);
            if ($email) $res->bindParam(":sEmail", $email);
            if ($userGroup) $res->bindParam(":sUsergroup", $userGroup);
            $res->bindParam(":sUserID", $user);

            $res->execute();
            $row = $this->fetchRow($res, "assoc");
        } catch (\Exception $e) {
            $response['success'] = false;
            $response['message'] = $e->getMessage();
            $response['test'] = \app\inc\Session::getUser();
            $response['code'] = 400;
            return $response;
        }

        $response['success'] = true;
        $response['message'] = "User update";
        $response['data'] = $row;
        return $response;
    }

    /**
     * @param string $data
     * @return array
     */
    public function deleteUser(string $data): array
    {
        $user = $data ? Model::toAscii($data, NULL, "_") : null;
        $sQuery = "DELETE FROM users WHERE screenname=:sUserID";
        try {
            $res = $this->prepare($sQuery);
            $res->execute([":sUserID" => $user]);
        } catch (\Exception $e) {
            $response['success'] = false;
            $response['message'] = $e->getMessage();
            $response['test'] = \app\inc\Session::getUser();
            $response['code'] = 400;
            return $response;
        }
        $response['success'] = true;
        $response['message'] = "User deleted";
        $response['data'] = $res->rowCount();
        return $response;
    }
}